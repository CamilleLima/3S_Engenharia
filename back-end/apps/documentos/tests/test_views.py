import os
import tempfile

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.clientes.models import Cliente, Vendedor
from apps.dimensionamento.models import Dimensionamento
from apps.financeiro import models as financeiro_models


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def cenario_proposta():
    vendedor = Vendedor.objects.create(
        nome="Vendedor Documentos",
        cargo="Consultor",
        telefone="68999730002",
        email="vendedor.documentos@teste.com",
    )
    cliente = Cliente.objects.create(
        nome="Cliente Documentos",
        cpf="78978978978",
        cep="69900000",
        rua="Rua Teste",
        bairro="Centro",
        cidade="Rio Branco",
        estado="AC",
        numero="500",
        consumo_kwh_mes=300,
        tipo_ligacao="bifasico",
        tipo_telhado="ceramico",
        vendedor=vendedor,
    )
    dimensionamento = Dimensionamento.objects.create(
        cliente=cliente,
        consumos_mensais=[300.0] * 12,
        irradiacao_media_cidade=4.56,
        fator_perda_decimal=0.22,
        custo_kit=12200.0,
        custo_adicionais=2000.0,
        margem_lucro_decimal=0.35,
        imposto_servico_decimal=0.07,
        taxa_juros_mensal_decimal=0.009,
        potencia_calculada_kwp=2.81,
        valor_total_sistema=18470.0,
        lucro_liquido_empresa=3971.1,
        financiamento_parcelas={"12": 1612.0},
    )
    calculo = financeiro_models.CalculoFinanceiro.objects.create(
        dimensionamento=dimensionamento,
        tarifa_energia_kwh=0.95,
        custo_disponibilidade_rs=50,
        investimento_total_rs=18470,
        geracao_mensal_kwh=300,
        economia_mensal_rs=234.85,
        economia_anual_rs=2818.2,
        payback_meses=78.65,
        payback_anos=6.55,
        economia_25_anos_rs=70455,
    )
    return {
        "dimensionamento": dimensionamento,
        "calculo": calculo,
    }


@pytest.mark.django_db
class TestDocumentosAPI:
    def test_gerar_relatorio(self, api_client, cenario_proposta):
        payload = {
            "dimensionamento": cenario_proposta["dimensionamento"].pk,
            "calculo_financeiro": cenario_proposta["calculo"].pk,
            "texto_adicional": "Teste RF4",
        }

        response = api_client.post(
            reverse("documentos:relatorio"),
            payload,
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["nome_cliente"] == "Cliente Documentos"
        assert response.data["cidade_uf"] == "Rio Branco/AC"
        assert response.data["texto_adicional"] == "Teste RF4"

    def test_gerar_pdf(self, api_client, cenario_proposta, monkeypatch):
        fd, fake_pdf_path = tempfile.mkstemp(suffix=".pdf")
        os.close(fd)
        with open(fake_pdf_path, "wb") as fake_pdf:
            fake_pdf.write(b"%PDF-1.4 fake")

        monkeypatch.setattr(
            "apps.documentos.views.gerar_proposta_pdf",
            lambda _dados: fake_pdf_path,
        )

        payload = {
            "dimensionamento": cenario_proposta["dimensionamento"].pk,
            "calculo_financeiro": cenario_proposta["calculo"].pk,
        }

        response = api_client.post(
            reverse("documentos:proposta_pdf"),
            payload,
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/pdf"
        assert b"%PDF" in response.content
