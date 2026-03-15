from decimal import Decimal

from rest_framework import serializers

from .models import Dimensionamento
from .services import DimensionamentoOrcamentoService


class DimensionamentoSerializer(serializers.ModelSerializer):
    """Serializer de leitura para os registros de dimensionamento."""

    potencia_calculada_kwp = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        coerce_to_string=False,
        read_only=True,
    )
    valor_total_sistema = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        coerce_to_string=False,
        read_only=True,
    )
    lucro_liquido_empresa = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        coerce_to_string=False,
        read_only=True,
    )

    class Meta:
        model = Dimensionamento
        fields = [
            "id",
            "cliente",
            "status",
            "consumos_mensais",
            "irradiacao_media_cidade",
            "fator_perda_decimal",
            "custo_kit",
            "custo_adicionais",
            "margem_lucro_decimal",
            "imposto_servico_decimal",
            "taxa_juros_mensal_decimal",
            "potencia_calculada_kwp",
            "valor_total_sistema",
            "lucro_liquido_empresa",
            "financiamento_parcelas",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "potencia_calculada_kwp",
            "valor_total_sistema",
            "lucro_liquido_empresa",
            "financiamento_parcelas",
            "created_at",
            "updated_at",
        ]


class DimensionamentoCalculoSerializer(serializers.ModelSerializer):
    """Serializer de criação que calcula e persiste o dimensionamento."""

    consumos_mensais = serializers.ListField(
        child=serializers.DecimalField(
            max_digits=12,
            decimal_places=2,
            min_value=Decimal("0"),
        ),
        min_length=12,
        max_length=12,
    )
    irradiacao_media_cidade = serializers.DecimalField(
        max_digits=8,
        decimal_places=4,
        min_value=Decimal("0.0001"),
    )
    fator_perda_decimal = serializers.DecimalField(
        max_digits=6,
        decimal_places=4,
        min_value=Decimal("0"),
        max_value=Decimal("0.9999"),
    )
    custo_kit = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0"),
    )
    custo_adicionais = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0"),
    )
    margem_lucro_decimal = serializers.DecimalField(
        max_digits=6,
        decimal_places=4,
        min_value=Decimal("0"),
    )
    imposto_servico_decimal = serializers.DecimalField(
        max_digits=6,
        decimal_places=4,
        min_value=Decimal("0"),
    )
    taxa_juros_mensal_decimal = serializers.DecimalField(
        max_digits=8,
        decimal_places=6,
        min_value=Decimal("0"),
    )

    class Meta:
        model = Dimensionamento
        fields = [
            "cliente",
            "consumos_mensais",
            "irradiacao_media_cidade",
            "fator_perda_decimal",
            "custo_kit",
            "custo_adicionais",
            "margem_lucro_decimal",
            "imposto_servico_decimal",
            "taxa_juros_mensal_decimal",
        ]

    def create(self, validated_data):
        cliente = validated_data["cliente"]
        dados_calculo = {k: v for k, v in validated_data.items() if k != "cliente"}
        dados_calculo["consumos_mensais"] = [
            float(v) for v in dados_calculo["consumos_mensais"]
        ]

        try:
            service = DimensionamentoOrcamentoService(**dados_calculo)
            resultado = service.calcular()
        except ValueError as exc:
            raise serializers.ValidationError({"detail": str(exc)}) from exc

        return Dimensionamento.objects.create(
            cliente=cliente,
            **dados_calculo,
            **resultado,
        )


class DimensionamentoGeoCalculoSerializer(serializers.Serializer):
    """Entrada mínima para cálculo geográfico de orçamento."""

    consumo_kwh_mes = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )
    uf = serializers.CharField(min_length=2, max_length=2)
    latitude_cliente = serializers.FloatField(min_value=-90, max_value=90)
    longitude_cliente = serializers.FloatField(min_value=-180, max_value=180)

    def validate_uf(self, value: str) -> str:
        return value.strip().upper()


class DimensionamentoGeoRespostaSerializer(serializers.Serializer):
    """Resposta do cálculo geográfico integrado."""

    uf = serializers.CharField()
    fator_perda_decimal = serializers.FloatField()
    irradiacao_media_cidade = serializers.FloatField()
    inclinacao_ideal_graus = serializers.FloatField()
    estacao_mais_proxima = serializers.DictField()
    parametros_financeiros_utilizados = serializers.DictField()
    potencia_calculada_kwp = serializers.FloatField()
    valor_total_sistema = serializers.FloatField()
    lucro_liquido_empresa = serializers.FloatField()
    financiamento_parcelas = serializers.DictField()


class OrcamentoEtapasDimensionamentoInputSerializer(serializers.Serializer):
    """Dados técnicos para a etapa de dimensionamento no fluxo único."""

    uf = serializers.CharField(min_length=2, max_length=2)
    latitude_cliente = serializers.FloatField(min_value=-90, max_value=90)
    longitude_cliente = serializers.FloatField(min_value=-180, max_value=180)
    custo_kit = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        min_value=Decimal("0"),
    )
    custo_adicionais = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        min_value=Decimal("0"),
    )
    margem_lucro_decimal = serializers.DecimalField(
        max_digits=6,
        decimal_places=4,
        required=False,
        min_value=Decimal("0"),
    )
    imposto_servico_decimal = serializers.DecimalField(
        max_digits=6,
        decimal_places=4,
        required=False,
        min_value=Decimal("0"),
    )
    taxa_juros_mensal_decimal = serializers.DecimalField(
        max_digits=8,
        decimal_places=6,
        required=False,
        min_value=Decimal("0"),
    )

    def validate_uf(self, value: str) -> str:
        return value.strip().upper()


class OrcamentoEtapasRequestSerializer(serializers.Serializer):
    """Payload completo: cliente + etapa técnica no mesmo envio."""

    cliente = serializers.DictField()
    dimensionamento = OrcamentoEtapasDimensionamentoInputSerializer()


class DashboardBudgetItemSerializer(serializers.Serializer):
    """Item de orçamento exibido na dashboard do front-end."""

    id = serializers.CharField()
    clientName = serializers.CharField()
    city = serializers.CharField()
    power = serializers.FloatField()
    value = serializers.FloatField()
    date = serializers.CharField()
    status = serializers.ChoiceField(choices=["pending", "accepted", "rejected"])
    consumption = serializers.FloatField()


class DashboardResumoSerializer(serializers.Serializer):
    """Resposta consolidada da dashboard."""

    total_budgets = serializers.IntegerField()
    total_value = serializers.FloatField()
    accepted_count = serializers.IntegerField()
    budgets = DashboardBudgetItemSerializer(many=True)


class PropostaClienteSerializer(serializers.Serializer):
    """Dados do cliente na visualização detalhada da proposta."""

    id = serializers.IntegerField()
    nome = serializers.CharField()
    cidade = serializers.CharField()
    estado = serializers.CharField()
    telefone = serializers.CharField(allow_blank=True)
    email = serializers.CharField(allow_blank=True)
    consumo_kwh_mes = serializers.FloatField()
    tipo_ligacao = serializers.CharField()
    tipo_telhado = serializers.CharField()


class PropostaDimensionamentoSerializer(serializers.Serializer):
    """Dados de dimensionamento na visualização detalhada da proposta."""

    id = serializers.IntegerField()
    potencia_calculada_kwp = serializers.FloatField()
    valor_total_sistema = serializers.FloatField()
    lucro_liquido_empresa = serializers.FloatField()
    irradiacao_media_cidade = serializers.FloatField()
    fator_perda_decimal = serializers.FloatField()
    financiamento_parcelas = serializers.DictField()
    created_at = serializers.CharField()


class PropostaFinanceiroSerializer(serializers.Serializer):
    """Dados de RF3 associados à proposta."""

    id = serializers.IntegerField()
    investimento_total_rs = serializers.FloatField()
    geracao_mensal_kwh = serializers.FloatField()
    economia_mensal_rs = serializers.FloatField()
    economia_anual_rs = serializers.FloatField()
    payback_meses = serializers.FloatField()
    payback_anos = serializers.FloatField()
    economia_25_anos_rs = serializers.FloatField()


class PropostaDetalheSerializer(serializers.Serializer):
    """Resposta de detalhe de proposta para a tela de visualização."""

    cliente = PropostaClienteSerializer()
    dimensionamento = PropostaDimensionamentoSerializer()
    financeiro = PropostaFinanceiroSerializer(allow_null=True)
    status = serializers.ChoiceField(choices=["pending", "accepted", "rejected"])


class PropostaStatusUpdateSerializer(serializers.Serializer):
    """Payload para atualização de status da proposta."""

    status = serializers.ChoiceField(choices=["pending", "accepted", "rejected"])
