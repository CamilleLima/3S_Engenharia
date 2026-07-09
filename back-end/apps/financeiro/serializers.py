from rest_framework import serializers

from apps.dimensionamento.models import Dimensionamento

from .models import CalculoFinanceiro
from .services import CalculoFinanceiroService


class CalculoFinanceiroSerializer(serializers.ModelSerializer):
    """Serializer de leitura para resultados financeiros."""

    class Meta:
        model = CalculoFinanceiro
        fields = [
            "id",
            "dimensionamento",
            "tarifa_energia_kwh",
            "custo_disponibilidade_rs",
            "investimento_total_rs",
            "geracao_mensal_kwh",
            "economia_mensal_rs",
            "economia_anual_rs",
            "payback_meses",
            "payback_anos",
            "economia_25_anos_rs",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "investimento_total_rs",
            "geracao_mensal_kwh",
            "economia_mensal_rs",
            "economia_anual_rs",
            "payback_meses",
            "payback_anos",
            "economia_25_anos_rs",
            "created_at",
            "updated_at",
        ]


class CalculoFinanceiroCalcularSerializer(serializers.ModelSerializer):
    """Serializer de criação que executa cálculo financeiro RF3."""

    dimensionamento = serializers.PrimaryKeyRelatedField(
        queryset=Dimensionamento.objects.all()
    )

    class Meta:
        model = CalculoFinanceiro
        fields = [
            "dimensionamento",
            "tarifa_energia_kwh",
            "custo_disponibilidade_rs",
        ]

    def create(self, validated_data):
        dimensionamento = validated_data["dimensionamento"]

        try:
            service = CalculoFinanceiroService(
                dimensionamento=dimensionamento,
                tarifa_energia_kwh=validated_data["tarifa_energia_kwh"],
                custo_disponibilidade_rs=validated_data.get(
                    "custo_disponibilidade_rs",
                    50,
                ),
            )
            resultado = service.calcular()
        except ValueError as exc:
            raise serializers.ValidationError({"detail": str(exc)}) from exc

        return CalculoFinanceiro.objects.create(
            dimensionamento=dimensionamento,
            tarifa_energia_kwh=validated_data["tarifa_energia_kwh"],
            custo_disponibilidade_rs=validated_data.get(
                "custo_disponibilidade_rs",
                50,
            ),
            **resultado,
        )
