import os

from django.http import HttpResponse
from rest_framework.exceptions import ValidationError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.dimensionamento.models import Dimensionamento
from apps.financeiro.models import CalculoFinanceiro

from .defaults import (
    build_initial_preview_state,
    merge_mutable_preview_fields,
    sanitize_preview_state_payload,
)
from .generators.pdf import gerar_proposta_pdf
from .models import PreviewTemplate, PropostaPreviewState
from .serializers import (
    DocumentoPropostaRequestSerializer,
    PropostaPreviewStateSerializer,
    PropostaPreviewStateUpsertSerializer,
)
from .services import DocumentoPropostaService


class RelatorioPropostaAPIView(APIView):
    """RF4: retorna dados consolidados da proposta para revisão/edição."""

    def post(self, request, *args, **kwargs):
        serializer = DocumentoPropostaRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dados = DocumentoPropostaService.montar_dados_proposta(
            dimensionamento=serializer.validated_data["dimensionamento"],
            calculo_financeiro=serializer.validated_data["calculo_financeiro"],
            company_name=serializer.validated_data.get("company_name"),
            company_cnpj=serializer.validated_data.get("company_cnpj"),
            proposal_title=serializer.validated_data.get("proposal_title"),
            proposal_date=serializer.validated_data.get("proposal_date"),
            validity_days=serializer.validated_data.get("validity_days"),
            responsible_name=serializer.validated_data.get("responsible_name"),
            responsible_contact=serializer.validated_data.get("responsible_contact"),
            generation_warning=serializer.validated_data.get("generation_warning"),
            contract_terms=serializer.validated_data.get("contract_terms"),
            included_services=serializer.validated_data.get("included_services"),
            texto_adicional=serializer.validated_data.get("texto_adicional"),
            imagem_extra_path=serializer.validated_data.get("imagem_extra_path"),
        )
        return Response(dados, status=status.HTTP_200_OK)


class PropostaPDFAPIView(APIView):
    """RF5: gera o documento final em PDF para envio ao cliente."""

    def post(self, request, *args, **kwargs):
        serializer = DocumentoPropostaRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dados = DocumentoPropostaService.montar_dados_proposta(
            dimensionamento=serializer.validated_data["dimensionamento"],
            calculo_financeiro=serializer.validated_data["calculo_financeiro"],
            company_name=serializer.validated_data.get("company_name"),
            company_cnpj=serializer.validated_data.get("company_cnpj"),
            proposal_title=serializer.validated_data.get("proposal_title"),
            proposal_date=serializer.validated_data.get("proposal_date"),
            validity_days=serializer.validated_data.get("validity_days"),
            responsible_name=serializer.validated_data.get("responsible_name"),
            responsible_contact=serializer.validated_data.get("responsible_contact"),
            generation_warning=serializer.validated_data.get("generation_warning"),
            contract_terms=serializer.validated_data.get("contract_terms"),
            included_services=serializer.validated_data.get("included_services"),
            texto_adicional=serializer.validated_data.get("texto_adicional"),
            imagem_extra_path=serializer.validated_data.get("imagem_extra_path"),
        )

        pdf_path = gerar_proposta_pdf(dados)
        try:
            with open(pdf_path, "rb") as pdf_file:
                pdf_bytes = pdf_file.read()
        finally:
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

        filename = f"proposta-{dados['dimensionamento_id']}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class PropostaPreviewStateAPIView(APIView):
    """Recupera/salva o estado editável do preview da proposta."""

    @staticmethod
    def _get_dimensionamento(dimensionamento_id: int) -> Dimensionamento:
        dimensionamento = (
            Dimensionamento.objects.select_related("cliente", "cliente__vendedor")
            .filter(pk=dimensionamento_id)
            .first()
        )
        if not dimensionamento:
            raise ValidationError({"detail": "Proposta não encontrada."})
        return dimensionamento

    @staticmethod
    def _get_financeiro(dimensionamento: Dimensionamento) -> CalculoFinanceiro | None:
        return (
            CalculoFinanceiro.objects.filter(dimensionamento=dimensionamento)
            .order_by("-created_at")
            .first()
        )

    @staticmethod
    def _get_or_create_state(dimensionamento: Dimensionamento) -> PropostaPreviewState:
        state = PropostaPreviewState.objects.filter(dimensionamento=dimensionamento).first()
        if state:
            return state

        template = PreviewTemplate.objects.filter(is_active=True).order_by("-updated_at").first()
        initial_data = build_initial_preview_state(
            dimensionamento=dimensionamento,
            calculo_financeiro=PropostaPreviewStateAPIView._get_financeiro(dimensionamento),
            template_data=template.data if template else None,
        )
        return PropostaPreviewState.objects.create(
            dimensionamento=dimensionamento,
            template=template,
            data=initial_data,
        )

    def get(self, request, dimensionamento_id, *args, **kwargs):
        dimensionamento = self._get_dimensionamento(dimensionamento_id)
        state = self._get_or_create_state(dimensionamento)
        base_state = build_initial_preview_state(
            dimensionamento=dimensionamento,
            calculo_financeiro=self._get_financeiro(dimensionamento),
            template_data=state.template.data if state.template else None,
        )
        state.data = merge_mutable_preview_fields(base_state, state.data)
        state.save(update_fields=["data", "updated_at"])
        return Response(PropostaPreviewStateSerializer(state).data, status=status.HTTP_200_OK)

    def put(self, request, dimensionamento_id, *args, **kwargs):
        serializer = PropostaPreviewStateUpsertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dimensionamento = self._get_dimensionamento(dimensionamento_id)
        state = self._get_or_create_state(dimensionamento)
        base_state = build_initial_preview_state(
            dimensionamento=dimensionamento,
            calculo_financeiro=self._get_financeiro(dimensionamento),
            template_data=state.template.data if state.template else None,
        )
        incoming_data = sanitize_preview_state_payload(serializer.validated_data.get("data"))
        state.data = merge_mutable_preview_fields(base_state, incoming_data)
        state.save(update_fields=["data", "updated_at"])

        return Response(PropostaPreviewStateSerializer(state).data, status=status.HTTP_200_OK)
