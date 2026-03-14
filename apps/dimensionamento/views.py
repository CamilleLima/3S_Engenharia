from django.db import transaction
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.clientes.models import Cliente
from apps.clientes.serializers import ClienteSerializer

from .models import Dimensionamento
from .reference_data import obter_estacoes_solares_referencia
from .serializers import (
    DimensionamentoCalculoSerializer,
    DimensionamentoGeoCalculoSerializer,
    DimensionamentoGeoRespostaSerializer,
    DimensionamentoSerializer,
    OrcamentoEtapasRequestSerializer,
)
from .services import DimensionamentoComGeolocalizacaoService


class DimensionamentoCalcularAPIView(CreateAPIView):
    """Recebe parâmetros de entrada, calcula, persiste e retorna o dimensionamento."""

    serializer_class = DimensionamentoCalculoSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        output = DimensionamentoSerializer(instance)
        return Response(output.data, status=status.HTTP_201_CREATED)


class DimensionamentoGeoCalcularAPIView(APIView):
    """Calcula orçamento com entrada mínima: consumo, UF e coordenadas."""

    def post(self, request, *args, **kwargs):
        input_serializer = DimensionamentoGeoCalculoSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        service = DimensionamentoComGeolocalizacaoService()
        try:
            resultado = service.calcular_orcamento(
                estacoes_solares=obter_estacoes_solares_referencia(),
                **input_serializer.validated_data,
            )
        except ValueError as exc:
            raise ValidationError({"detail": str(exc)}) from exc

        output_serializer = DimensionamentoGeoRespostaSerializer(data=resultado)
        output_serializer.is_valid(raise_exception=True)
        return Response(output_serializer.data, status=status.HTTP_200_OK)


class OrcamentoEtapasCreateAPIView(APIView):
    """Fluxo único para cliente + dimensionamento.

    Cria/atualiza cliente e gera dimensionamento em uma única requisição.
    """

    @staticmethod
    def _obter_ou_criar_cliente(cliente_data: dict) -> Cliente:
        cpf = cliente_data.get("cpf")
        if not cpf:
            raise ValidationError({"cliente": {"cpf": ["Este campo é obrigatório."]}})

        cliente_existente = Cliente.objects.filter(cpf=cpf).first()
        if cliente_existente:
            serializer = ClienteSerializer(
                cliente_existente,
                data=cliente_data,
                partial=True,
            )
        else:
            serializer = ClienteSerializer(data=cliente_data)

        serializer.is_valid(raise_exception=True)
        return serializer.save()

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        request_serializer = OrcamentoEtapasRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        cliente_data = request_serializer.validated_data["cliente"]
        dados_dim = request_serializer.validated_data["dimensionamento"]

        cliente = self._obter_ou_criar_cliente(cliente_data)

        service = DimensionamentoComGeolocalizacaoService()
        try:
            resultado = service.calcular_orcamento(
                consumo_kwh_mes=float(cliente.consumo_kwh_mes),
                uf=dados_dim["uf"],
                latitude_cliente=dados_dim["latitude_cliente"],
                longitude_cliente=dados_dim["longitude_cliente"],
                estacoes_solares=obter_estacoes_solares_referencia(),
                custo_kit=dados_dim.get("custo_kit"),
                custo_adicionais=dados_dim.get("custo_adicionais"),
                margem_lucro_decimal=dados_dim.get("margem_lucro_decimal"),
                imposto_servico_decimal=dados_dim.get("imposto_servico_decimal"),
                taxa_juros_mensal_decimal=dados_dim.get(
                    "taxa_juros_mensal_decimal"
                ),
            )
        except ValueError as exc:
            raise ValidationError({"dimensionamento": {"detail": str(exc)}}) from exc

        parametros = resultado["parametros_financeiros_utilizados"]
        registro = Dimensionamento.objects.create(
            cliente=cliente,
            consumos_mensais=[float(cliente.consumo_kwh_mes)] * 12,
            irradiacao_media_cidade=resultado["irradiacao_media_cidade"],
            fator_perda_decimal=resultado["fator_perda_decimal"],
            custo_kit=parametros["custo_kit"],
            custo_adicionais=parametros["custo_adicionais"],
            margem_lucro_decimal=parametros["margem_lucro_decimal"],
            imposto_servico_decimal=parametros["imposto_servico_decimal"],
            taxa_juros_mensal_decimal=parametros["taxa_juros_mensal_decimal"],
            potencia_calculada_kwp=resultado["potencia_calculada_kwp"],
            valor_total_sistema=resultado["valor_total_sistema"],
            lucro_liquido_empresa=resultado["lucro_liquido_empresa"],
            financiamento_parcelas=resultado["financiamento_parcelas"],
        )

        response_data = {
            "cliente_id": cliente.id,
            "dimensionamento": DimensionamentoSerializer(registro).data,
            "geo": {
                "uf": resultado["uf"],
                "fator_perda_decimal": resultado["fator_perda_decimal"],
                "irradiacao_media_cidade": resultado["irradiacao_media_cidade"],
                "inclinacao_ideal_graus": resultado["inclinacao_ideal_graus"],
                "estacao_mais_proxima": resultado["estacao_mais_proxima"],
            },
        }
        return Response(response_data, status=status.HTTP_201_CREATED)
