import os

from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .generators.pdf import gerar_proposta_pdf
from .serializers import DocumentoPropostaRequestSerializer
from .services import DocumentoPropostaService


class RelatorioPropostaAPIView(APIView):
    """RF4: retorna dados consolidados da proposta para revisão/edição."""

    def post(self, request, *args, **kwargs):
        serializer = DocumentoPropostaRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dados = DocumentoPropostaService.montar_dados_proposta(
            dimensionamento=serializer.validated_data["dimensionamento"],
            calculo_financeiro=serializer.validated_data["calculo_financeiro"],
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
