"""
URLs para o app documentos.
"""

from django.urls import path

from .views import PropostaPDFAPIView, RelatorioPropostaAPIView

app_name = "documentos"

urlpatterns = [
    path("relatorio/", RelatorioPropostaAPIView.as_view(), name="relatorio"),
    path("proposta-pdf/", PropostaPDFAPIView.as_view(), name="proposta_pdf"),
]
