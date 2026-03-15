import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.clientes.models import Cliente, Vendedor
from apps.dimensionamento.models import Dimensionamento
from apps.financeiro.models import CalculoFinanceiro


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def dimensionamento():
    vendedor = Vendedor.objects.create(
        nome="Vendedor Financeiro API",
        cargo="Consultor",
        telefone="68999730001",
        email="vendedor.financeiro.api@teste.com",
    )
    cliente = Cliente.objects.create(
        nome="Cliente Financeiro API",
        cpf="65465465465",
        cep="69900000",
        rua="Rua Teste",
        bairro="Centro",
        cidade="Rio Branco",
        estado="AC",
        numero="200",
        consumo_kwh_mes=300,
        tipo_ligacao="bifasico",
        tipo_telhado="ceramico",
        vendedor=vendedor,
    )
    return Dimensionamento.objects.create(
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


@pytest.mark.django_db
class TestCalculoFinanceiroAPI:
    def test_calcular_financeiro_com_sucesso(self, api_client, dimensionamento):
        payload = {
            "dimensionamento": dimensionamento.id,
            "tarifa_energia_kwh": 0.95,
            "custo_disponibilidade_rs": 50,
        }

        url = reverse("financeiro:calcular")
        response = api_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert float(response.data["investimento_total_rs"]) == 18470.0
        assert float(response.data["economia_mensal_rs"]) == 234.85
        assert float(response.data["payback_meses"]) == 78.65

        assert CalculoFinanceiro.objects.count() == 1

    def test_calcular_financeiro_com_economia_invalida(
        self,
        api_client,
        dimensionamento,
    ):
        payload = {
            "dimensionamento": dimensionamento.id,
            "tarifa_energia_kwh": 0.10,
            "custo_disponibilidade_rs": 1000,
        }

        url = reverse("financeiro:calcular")
        response = api_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "detail" in response.data
