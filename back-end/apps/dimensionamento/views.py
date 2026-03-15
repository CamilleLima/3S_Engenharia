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

    @staticmethod
    def _status_efetivo(dimensionamento: Dimensionamento, has_financeiro: bool) -> str:
        if dimensionamento.status == Dimensionamento.STATUS_PENDING and has_financeiro:
            return Dimensionamento.STATUS_ACCEPTED
        return dimensionamento.status

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
                "status": self._status_efetivo(item, item.has_financeiro),
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
            Dimensionamento.objects.select_related("cliente").filter(pk=pk).first()
        )
        if not dimensionamento:
            raise ValidationError({"detail": "Proposta não encontrada."})

        financeiro = (
            CalculoFinanceiro.objects.filter(dimensionamento=dimensionamento)
            .order_by("-created_at")
            .first()
        )
        has_financeiro = financeiro is not None
        status_efetivo = (
            Dimensionamento.STATUS_ACCEPTED
            if dimensionamento.status == Dimensionamento.STATUS_PENDING
            and has_financeiro
            else dimensionamento.status
        )

        data = {
            "cliente": {
                "id": dimensionamento.cliente.pk,
                "nome": dimensionamento.cliente.nome,
                "cidade": dimensionamento.cliente.cidade,
                "estado": dimensionamento.cliente.estado,
                "telefone": dimensionamento.cliente.telefone or "",
                "email": dimensionamento.cliente.email or "",
                "consumo_kwh_mes": float(dimensionamento.cliente.consumo_kwh_mes),
                "tipo_ligacao": dimensionamento.cliente.tipo_ligacao,
                "tipo_telhado": dimensionamento.cliente.tipo_telhado,
            },
            "dimensionamento": {
                "id": dimensionamento.pk,
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
            "status": status_efetivo,
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
