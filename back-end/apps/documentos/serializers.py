from rest_framework import serializers

from apps.dimensionamento.models import Dimensionamento
from apps.financeiro.models import CalculoFinanceiro


class DocumentoPropostaRequestSerializer(serializers.Serializer):
    """Entrada para geração de relatório editável (RF4) e PDF (RF5)."""

    dimensionamento = serializers.PrimaryKeyRelatedField(
        queryset=Dimensionamento.objects.select_related(
            "cliente",
            "cliente__vendedor",
        )
    )
    calculo_financeiro = serializers.PrimaryKeyRelatedField(
        queryset=CalculoFinanceiro.objects.select_related("dimensionamento"),
        required=False,
        allow_null=True,
    )
    texto_adicional = serializers.CharField(required=False, allow_blank=True)
    imagem_extra_path = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        dimensionamento = attrs["dimensionamento"]
        calculo_financeiro = attrs.get("calculo_financeiro")

        if calculo_financeiro is None:
            calculo_financeiro = (
                CalculoFinanceiro.objects.filter(dimensionamento=dimensionamento)
                .order_by("-created_at")
                .first()
            )

            if calculo_financeiro is None:
                raise serializers.ValidationError(
                    {
                        "calculo_financeiro": (
                            "Nenhum cálculo financeiro encontrado para este "
                            "dimensionamento."
                        )
                    }
                )

            attrs["calculo_financeiro"] = calculo_financeiro

        if calculo_financeiro.dimensionamento.pk != dimensionamento.pk:
            raise serializers.ValidationError(
                {
                    "calculo_financeiro": (
                        "O cálculo financeiro informado não pertence ao "
                        "dimensionamento selecionado."
                    )
                }
            )

        return attrs
