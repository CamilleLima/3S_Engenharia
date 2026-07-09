from django.db import transaction
from django.db.models import Exists, OuterRef, Sum
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.clientes.models import Cliente
from apps.clientes.serializers import ClienteSerializer
from apps.financeiro.models import CalculoFinanceiro
from apps.financeiro.services import CalculoFinanceiroService

from .models import Dimensionamento
from .reference_data import obter_estacoes_solares_referencia
from .serializers import (
    DashboardResumoSerializer,
    DimensionamentoCalculoSerializer,
    DimensionamentoGeoCalculoSerializer,
    DimensionamentoGeoRespostaSerializer,
    DimensionamentoSerializer,
    OrcamentoEtapasRequestSerializer,
    PropostaDetalheSerializer,
    PropostaRecalculoSerializer,
    PropostaStatusUpdateSerializer,
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
                taxa_juros_mensal_decimal=dados_dim.get("taxa_juros_mensal_decimal"),
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
            latitude_cliente=dados_dim["latitude_cliente"],
            longitude_cliente=dados_dim["longitude_cliente"],
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


class DashboardAPIView(APIView):
    """Retorna resumo e lista de orçamentos para a dashboard."""

    def get(self, request, *args, **kwargs):
        financeiro_subquery = CalculoFinanceiro.objects.filter(
            dimensionamento=OuterRef("pk")
        )

        queryset = (
            Dimensionamento.objects.select_related("cliente")
            .annotate(has_financeiro=Exists(financeiro_subquery))
            .order_by("-created_at")[:100]
        )

        budgets = [
            {
                "id": str(item.pk),
                "clientName": item.cliente.nome,
                "city": f"{item.cliente.cidade}, {item.cliente.estado}",
                "power": float(item.potencia_calculada_kwp),
                "value": float(item.valor_total_sistema),
                "date": item.created_at.strftime("%d/%m/%Y"),
                "status": item.status,
                "consumption": float(item.cliente.consumo_kwh_mes),
            }
            for item in queryset
        ]

        total_value = (
            Dimensionamento.objects.aggregate(total=Sum("valor_total_sistema"))["total"]
            or 0
        )
        accepted_count = sum(1 for item in budgets if item["status"] == "accepted")

        data = {
            "total_budgets": Dimensionamento.objects.count(),
            "total_value": float(total_value),
            "accepted_count": accepted_count,
            "budgets": budgets,
        }
        serializer = DashboardResumoSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PropostaDetalheAPIView(APIView):
    """Retorna os dados completos de uma proposta por dimensionamento."""

    def get(self, request, pk, *args, **kwargs):
        dimensionamento = (
            Dimensionamento.objects.select_related("cliente", "cliente__vendedor")
            .filter(pk=pk)
            .first()
        )
        if not dimensionamento:
            raise ValidationError({"detail": "Proposta não encontrada."})

        financeiro = (
            CalculoFinanceiro.objects.filter(dimensionamento=dimensionamento)
            .order_by("-created_at")
            .first()
        )
        has_financeiro = financeiro is not None

        data = {
            "cliente": {
                "id": dimensionamento.cliente.pk,
                "nome": dimensionamento.cliente.nome,
                "cpf": dimensionamento.cliente.cpf,
                "cidade": dimensionamento.cliente.cidade,
                "estado": dimensionamento.cliente.estado,
                "cep": dimensionamento.cliente.cep,
                "rua": dimensionamento.cliente.rua,
                "bairro": dimensionamento.cliente.bairro,
                "numero": dimensionamento.cliente.numero,
                "telefone": dimensionamento.cliente.telefone or "",
                "email": dimensionamento.cliente.email or "",
                "consumo_kwh_mes": float(dimensionamento.cliente.consumo_kwh_mes),
                "tipo_ligacao": dimensionamento.cliente.tipo_ligacao,
                "tipo_telhado": dimensionamento.cliente.tipo_telhado,
                "vendedor_id": dimensionamento.cliente.vendedor_id,
                "vendedor_nome": dimensionamento.cliente.vendedor.nome,
                "vendedor_cargo": dimensionamento.cliente.vendedor.cargo,
            },
            "dimensionamento": {
                "id": dimensionamento.pk,
                "latitude_cliente": (
                    float(dimensionamento.latitude_cliente)
                    if dimensionamento.latitude_cliente is not None
                    else None
                ),
                "longitude_cliente": (
                    float(dimensionamento.longitude_cliente)
                    if dimensionamento.longitude_cliente is not None
                    else None
                ),
                "custo_kit": float(dimensionamento.custo_kit),
                "custo_adicionais": float(dimensionamento.custo_adicionais),
                "margem_lucro_decimal": float(dimensionamento.margem_lucro_decimal),
                "potencia_calculada_kwp": float(dimensionamento.potencia_calculada_kwp),
                "valor_total_sistema": float(dimensionamento.valor_total_sistema),
                "lucro_liquido_empresa": float(dimensionamento.lucro_liquido_empresa),
                "irradiacao_media_cidade": float(
                    dimensionamento.irradiacao_media_cidade
                ),
                "fator_perda_decimal": float(dimensionamento.fator_perda_decimal),
                "financiamento_parcelas": dimensionamento.financiamento_parcelas,
                "created_at": dimensionamento.created_at.strftime("%d/%m/%Y"),
            },
            "financeiro": (
                {
                    "id": financeiro.pk,
                    "investimento_total_rs": float(financeiro.investimento_total_rs),
                    "geracao_mensal_kwh": float(financeiro.geracao_mensal_kwh),
                    "economia_mensal_rs": float(financeiro.economia_mensal_rs),
                    "economia_anual_rs": float(financeiro.economia_anual_rs),
                    "payback_meses": float(financeiro.payback_meses),
                    "payback_anos": float(financeiro.payback_anos),
                    "economia_25_anos_rs": float(financeiro.economia_25_anos_rs),
                }
                if financeiro
                else None
            ),
            "status": dimensionamento.status,
        }

        serializer = PropostaDetalheSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PropostaStatusUpdateAPIView(APIView):
    """Atualiza o status de uma proposta por id de dimensionamento."""

    def patch(self, request, pk, *args, **kwargs):
        dimensionamento = Dimensionamento.objects.filter(pk=pk).first()
        if not dimensionamento:
            raise ValidationError({"detail": "Proposta não encontrada."})

        serializer = PropostaStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dimensionamento.status = serializer.validated_data["status"]
        dimensionamento.save(update_fields=["status", "updated_at"])

        return Response(
            {
                "id": dimensionamento.pk,
                "status": dimensionamento.status,
            },
            status=status.HTTP_200_OK,
        )


class PropostaRecalcularAPIView(APIView):
    """Recalcula uma proposta após atualização técnica (ex: nova coordenada)."""

    def patch(self, request, pk, *args, **kwargs):
        dimensionamento = (
            Dimensionamento.objects.select_related("cliente").filter(pk=pk).first()
        )
        if not dimensionamento:
            raise ValidationError({"detail": "Proposta não encontrada."})

        serializer = PropostaRecalculoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        latitude = serializer.validated_data["latitude_cliente"]
        longitude = serializer.validated_data["longitude_cliente"]
        custo_kit = serializer.validated_data.get(
            "custo_kit", dimensionamento.custo_kit
        )
        custo_adicionais = serializer.validated_data.get(
            "custo_adicionais", dimensionamento.custo_adicionais
        )

        service = DimensionamentoComGeolocalizacaoService()
        try:
            resultado = service.calcular_orcamento(
                consumo_kwh_mes=float(dimensionamento.cliente.consumo_kwh_mes),
                uf=dimensionamento.cliente.estado,
                latitude_cliente=latitude,
                longitude_cliente=longitude,
                estacoes_solares=obter_estacoes_solares_referencia(),
                custo_kit=float(custo_kit),
                custo_adicionais=float(custo_adicionais),
                margem_lucro_decimal=float(dimensionamento.margem_lucro_decimal),
                imposto_servico_decimal=float(dimensionamento.imposto_servico_decimal),
                taxa_juros_mensal_decimal=float(
                    dimensionamento.taxa_juros_mensal_decimal
                ),
            )
        except ValueError as exc:
            raise ValidationError({"detail": str(exc)}) from exc

        dimensionamento.consumos_mensais = [float(dimensionamento.cliente.consumo_kwh_mes)] * 12
        dimensionamento.latitude_cliente = latitude
        dimensionamento.longitude_cliente = longitude
        dimensionamento.custo_kit = custo_kit
        dimensionamento.custo_adicionais = custo_adicionais
        dimensionamento.irradiacao_media_cidade = resultado["irradiacao_media_cidade"]
        dimensionamento.fator_perda_decimal = resultado["fator_perda_decimal"]
        dimensionamento.potencia_calculada_kwp = resultado["potencia_calculada_kwp"]
        dimensionamento.valor_total_sistema = resultado["valor_total_sistema"]
        dimensionamento.lucro_liquido_empresa = resultado["lucro_liquido_empresa"]
        dimensionamento.financiamento_parcelas = resultado["financiamento_parcelas"]
        dimensionamento.save(
            update_fields=[
                "consumos_mensais",
                "latitude_cliente",
                "longitude_cliente",
                "custo_kit",
                "custo_adicionais",
                "irradiacao_media_cidade",
                "fator_perda_decimal",
                "potencia_calculada_kwp",
                "valor_total_sistema",
                "lucro_liquido_empresa",
                "financiamento_parcelas",
                "updated_at",
            ]
        )

        calculos = CalculoFinanceiro.objects.filter(dimensionamento=dimensionamento)
        for calculo in calculos:
            financeiro_service = CalculoFinanceiroService(
                dimensionamento=dimensionamento,
                tarifa_energia_kwh=calculo.tarifa_energia_kwh,
                custo_disponibilidade_rs=calculo.custo_disponibilidade_rs,
            )
            resultado_financeiro = financeiro_service.calcular()
            for campo, valor in resultado_financeiro.items():
                setattr(calculo, campo, valor)
            calculo.save()

        output = DimensionamentoSerializer(dimensionamento)
        return Response(output.data, status=status.HTTP_200_OK)
