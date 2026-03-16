from rest_framework import serializers

from apps.dimensionamento.models import Dimensionamento
from apps.financeiro.models import CalculoFinanceiro

from .models import PropostaPreviewState


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
    company_name = serializers.CharField(required=False, allow_blank=True)
    company_cnpj = serializers.CharField(required=False, allow_blank=True)
    proposal_title = serializers.CharField(required=False, allow_blank=True)
    proposal_date = serializers.CharField(required=False, allow_blank=True)
    validity_days = serializers.IntegerField(required=False, min_value=1)
    responsible_name = serializers.CharField(required=False, allow_blank=True)
    responsible_contact = serializers.CharField(required=False, allow_blank=True)
    generation_warning = serializers.CharField(required=False, allow_blank=True)
    contract_terms = serializers.CharField(required=False, allow_blank=True)
    included_services = serializers.CharField(required=False, allow_blank=True)
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


class PropostaPreviewStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropostaPreviewState
        fields = [
            "id",
            "dimensionamento",
            "template",
            "data",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PropostaPreviewStateUpsertSerializer(serializers.Serializer):
    data = serializers.JSONField()

    def validate_data(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("O campo data deve ser um objeto JSON.")
        if "editable" not in value:
            raise serializers.ValidationError(
                "O campo data precisa conter o objeto editable."
            )
        return value
