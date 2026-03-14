import pytest
import responses
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.clientes.models import Cliente, Vendedor
from apps.dimensionamento.models import Dimensionamento


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def cliente():
    vendedor = Vendedor.objects.create(
        nome="Vendedor RF2",
        cargo="Vendedor",
        telefone="68999738807",
        email="vendedor-rf2@teste.com",
    )
    return Cliente.objects.create(
        nome="Cliente RF2",
        cpf="12312312312",
        cep="69900000",
        rua="Rua Teste",
        bairro="Centro",
        cidade="Rio Branco",
        estado="AC",
        numero="100",
        consumo_kwh_mes=350,
        tipo_ligacao="bifasico",
        tipo_telhado="ceramico",
        vendedor=vendedor,
    )


@pytest.mark.django_db
class TestDimensionamentoCalcularAPI:
    def test_calcular_dimensionamento_com_sucesso(self, api_client, cliente):
        payload = {
            "cliente": cliente.id,
            "consumos_mensais": [300.0] * 12,
            "irradiacao_media_cidade": 4.56,
            "fator_perda_decimal": 0.22,
            "custo_kit": 12200.0,
            "custo_adicionais": 2000.0,
            "margem_lucro_decimal": 0.35,
            "imposto_servico_decimal": 0.07,
            "taxa_juros_mensal_decimal": 0.009,
        }

        url = reverse("dimensionamento:calcular")
        response = api_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert float(response.data["potencia_calculada_kwp"]) == 2.81
        assert float(response.data["valor_total_sistema"]) == 18470.0
        assert float(response.data["lucro_liquido_empresa"]) == 3971.1
        assert set(response.data["financiamento_parcelas"].keys()) == {
            "12",
            "24",
            "36",
            "48",
            "60",
        }

        registro = Dimensionamento.objects.get(pk=response.data["id"])
        assert registro.cliente == cliente
        assert float(registro.potencia_calculada_kwp) == 2.81

    def test_calcular_dimensionamento_payload_invalido(self, api_client, cliente):
        payload = {
            "cliente": cliente.id,
            "consumos_mensais": [300.0] * 11,
            "irradiacao_media_cidade": 4.56,
            "fator_perda_decimal": 0.22,
            "custo_kit": 12200.0,
            "custo_adicionais": 2000.0,
            "margem_lucro_decimal": 0.35,
            "imposto_servico_decimal": 0.07,
            "taxa_juros_mensal_decimal": 0.009,
        }

        url = reverse("dimensionamento:calcular")
        response = api_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "consumos_mensais" in response.data


@pytest.mark.django_db
class TestDimensionamentoGeoCalcularAPI:
    def test_calcular_geo_com_sucesso(self, api_client):
        payload = {
            "consumo_kwh_mes": 300.0,
            "uf": "ac",
            "latitude_cliente": -9.98,
            "longitude_cliente": -67.82,
        }

        url = reverse("dimensionamento:calcular-geo")
        response = api_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["uf"] == "AC"
        assert response.data["fator_perda_decimal"] == 0.08
        assert response.data["irradiacao_media_cidade"] > 0
        assert response.data["inclinacao_ideal_graus"] == 9.98
        assert response.data["estacao_mais_proxima"]["id"] == "EST-AC-001"
        assert response.data["valor_total_sistema"] == 18470.0

    def test_calcular_geo_uf_sem_mapeamento(self, api_client):
        payload = {
            "consumo_kwh_mes": 300.0,
            "uf": "SP",
            "latitude_cliente": -23.55,
            "longitude_cliente": -46.63,
        }

        url = reverse("dimensionamento:calcular-geo")
        response = api_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "detail" in response.data


@pytest.mark.django_db
class TestOrcamentoEtapasAPI:
    @pytest.fixture
    def vendedor(self):
        return Vendedor.objects.create(
            nome="Vendedor Etapas",
            cargo="Consultor",
            telefone="68999990000",
            email="vendedor-etapas@teste.com",
        )

    @responses.activate
    def test_criar_cliente_e_dimensionamento_no_mesmo_fluxo(
        self,
        api_client,
        vendedor,
    ):
        responses.add(
            responses.GET,
            "https://viacep.com.br/ws/69900000/json/",
            json={
                "cep": "69900-000",
                "logradouro": "Rua Teste",
                "bairro": "Centro",
                "localidade": "Rio Branco",
                "uf": "AC",
            },
            status=200,
        )

        payload = {
            "cliente": {
                "nome": "Cliente Etapas",
                "cpf": "98765432100",
                "telefone": "68999738807",
                "email": "cliente-etapas@teste.com",
                "cep": "69900000",
                "rua": "Rua Teste",
                "bairro": "Centro",
                "cidade": "Rio Branco",
                "estado": "AC",
                "numero": "123",
                "consumo_kwh_mes": 300,
                "tipo_ligacao": "bifasico",
                "tipo_telhado": "ceramico",
                "vendedor": vendedor.id,
            },
            "dimensionamento": {
                "uf": "AC",
                "latitude_cliente": -9.98,
                "longitude_cliente": -67.82,
            },
        }

        url = reverse("dimensionamento:orcamento-etapas")
        response = api_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["geo"]["uf"] == "AC"
        assert response.data["dimensionamento"]["valor_total_sistema"] == 18470.0
        assert Cliente.objects.filter(cpf="98765432100").count() == 1
        assert Dimensionamento.objects.count() >= 1

    def test_reaproveitar_cliente_existente_por_cpf(self, api_client, vendedor):
        cliente = Cliente.objects.create(
            nome="Cliente Existente",
            cpf="11122233344",
            telefone="68999738807",
            email="existente@teste.com",
            cep="69900000",
            rua="Rua A",
            bairro="Centro",
            cidade="Rio Branco",
            estado="AC",
            numero="10",
            consumo_kwh_mes=250,
            tipo_ligacao="monofasico",
            tipo_telhado="laje",
            vendedor=vendedor,
        )

        payload = {
            "cliente": {
                "nome": "Cliente Existente Atualizado",
                "cpf": "11122233344",
                "consumo_kwh_mes": 280,
            },
            "dimensionamento": {
                "uf": "AC",
                "latitude_cliente": -9.98,
                "longitude_cliente": -67.82,
            },
        }

        url = reverse("dimensionamento:orcamento-etapas")
        response = api_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert Cliente.objects.filter(cpf="11122233344").count() == 1
        cliente.refresh_from_db()
        assert cliente.nome == "Cliente Existente Atualizado"
        assert cliente.consumo_kwh_mes == 280

    def test_criar_orcamento_sem_depender_da_viacep_quando_endereco_completo(
        self,
        api_client,
        vendedor,
        monkeypatch,
    ):
        def falhar_viacep(_cep):
            raise RuntimeError("ViaCEP indisponível")

        monkeypatch.setattr(
            "apps.clientes.serializers.buscar_endereco_por_cep",
            falhar_viacep,
        )

        payload = {
            "cliente": {
                "nome": "Cliente Sem ViaCEP",
                "cpf": "77788899900",
                "telefone": "68999738807",
                "email": "semviacep@teste.com",
                "cep": "69900000",
                "rua": "Rua Manual",
                "bairro": "Centro",
                "cidade": "Rio Branco",
                "estado": "AC",
                "numero": "200",
                "consumo_kwh_mes": 310,
                "tipo_ligacao": "bifasico",
                "tipo_telhado": "ceramico",
                "vendedor": vendedor.id,
            },
            "dimensionamento": {
                "uf": "AC",
                "latitude_cliente": -9.98,
                "longitude_cliente": -67.82,
            },
        }

        url = reverse("dimensionamento:orcamento-etapas")
        response = api_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["geo"]["uf"] == "AC"
