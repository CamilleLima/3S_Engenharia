import pytest
import responses
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


@pytest.mark.django_db
class TestDashboardAPI:
    def test_dashboard_retorna_resumo_e_budgets(self, api_client, cliente):
        dim_pending = Dimensionamento.objects.create(
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
        dim_accepted = Dimensionamento.objects.create(
            cliente=cliente,
            consumos_mensais=[350.0] * 12,
            irradiacao_media_cidade=4.56,
            fator_perda_decimal=0.22,
            custo_kit=13000.0,
            custo_adicionais=2500.0,
            margem_lucro_decimal=0.35,
            imposto_servico_decimal=0.07,
            taxa_juros_mensal_decimal=0.009,
            potencia_calculada_kwp=3.10,
            valor_total_sistema=21000.0,
            lucro_liquido_empresa=4200.0,
            financiamento_parcelas={"12": 1800.0},
        )
        CalculoFinanceiro.objects.create(
            dimensionamento=dim_accepted,
            tarifa_energia_kwh=0.95,
            custo_disponibilidade_rs=50,
            investimento_total_rs=21000,
            geracao_mensal_kwh=330,
            economia_mensal_rs=260,
            economia_anual_rs=3120,
            payback_meses=80,
            payback_anos=6.66,
            economia_25_anos_rs=78000,
        )

        url = reverse("dimensionamento:dashboard")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_budgets"] == 2
        assert response.data["accepted_count"] == 1
        assert float(response.data["total_value"]) == 39470.0
        assert len(response.data["budgets"]) == 2

        status_por_id = {
            item["id"]: item["status"] for item in response.data["budgets"]
        }
        assert status_por_id[str(dim_pending.pk)] == "pending"
        assert status_por_id[str(dim_accepted.pk)] == "accepted"

    def test_dashboard_respeita_status_rejected(self, api_client, cliente):
        dim_rejected = Dimensionamento.objects.create(
            cliente=cliente,
            consumos_mensais=[320.0] * 12,
            irradiacao_media_cidade=4.56,
            fator_perda_decimal=0.22,
            custo_kit=12000.0,
            custo_adicionais=1800.0,
            margem_lucro_decimal=0.35,
            imposto_servico_decimal=0.07,
            taxa_juros_mensal_decimal=0.009,
            potencia_calculada_kwp=2.90,
            valor_total_sistema=19000.0,
            lucro_liquido_empresa=3800.0,
            financiamento_parcelas={"12": 1650.0},
            status="rejected",
        )
        CalculoFinanceiro.objects.create(
            dimensionamento=dim_rejected,
            tarifa_energia_kwh=0.95,
            custo_disponibilidade_rs=50,
            investimento_total_rs=19000,
            geracao_mensal_kwh=310,
            economia_mensal_rs=240,
            economia_anual_rs=2880,
            payback_meses=79,
            payback_anos=6.58,
            economia_25_anos_rs=72000,
        )

        url = reverse("dimensionamento:dashboard")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        status_por_id = {
            item["id"]: item["status"] for item in response.data["budgets"]
        }
        assert status_por_id[str(dim_rejected.pk)] == "rejected"


@pytest.mark.django_db
class TestPropostaDetalheAPI:
    def test_detalhe_retorna_financeiro_quando_existir(self, api_client, cliente):
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
        CalculoFinanceiro.objects.create(
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

        url = reverse("dimensionamento:detalhe", args=[dimensionamento.pk])
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "accepted"
        assert response.data["cliente"]["nome"] == cliente.nome
        assert float(response.data["dimensionamento"]["valor_total_sistema"]) == 18470.0
        assert float(response.data["financeiro"]["payback_anos"]) == 6.55

    def test_detalhe_sem_financeiro_retorna_pending(self, api_client, cliente):
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

        url = reverse("dimensionamento:detalhe", args=[dimensionamento.pk])
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "pending"
        assert response.data["financeiro"] is None


@pytest.mark.django_db
class TestPropostaStatusUpdateAPI:
    def test_patch_status_proposta(self, api_client, cliente):
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

        url = reverse("dimensionamento:status", args=[dimensionamento.pk])
        response = api_client.patch(url, {"status": "rejected"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "rejected"

        dimensionamento.refresh_from_db()
        assert dimensionamento.status == "rejected"


@pytest.mark.django_db
class TestOrcamentoEtapasClienteExistente:
    @pytest.fixture
    def vendedor(self):
        return Vendedor.objects.create(
            nome="Vendedor Etapas",
            cargo="Consultor",
            telefone="68999990000",
            email="vendedor-etapas@teste.com",
        )

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
