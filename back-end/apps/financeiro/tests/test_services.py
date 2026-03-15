import pytest

from apps.clientes.models import Cliente, Vendedor
from apps.dimensionamento.models import Dimensionamento
from apps.financeiro.services import CalculoFinanceiroService


@pytest.mark.django_db
class TestCalculoFinanceiro:
    @pytest.fixture
    def dimensionamento(self):
        vendedor = Vendedor.objects.create(
            nome="Vendedor Financeiro",
            cargo="Consultor",
            telefone="68999730000",
            email="vendedor.financeiro@teste.com",
        )
        cliente = Cliente.objects.create(
            nome="Cliente Financeiro",
            cpf="32132132132",
            cep="69900000",
            rua="Rua Teste",
            bairro="Centro",
            cidade="Rio Branco",
            estado="AC",
            numero="100",
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

    def test_calculo_financeiro_nominal(self, dimensionamento):
        service = CalculoFinanceiroService(
            dimensionamento=dimensionamento,
            tarifa_energia_kwh=0.95,
            custo_disponibilidade_rs=50,
        )

        resultado = service.calcular()

        assert resultado["investimento_total_rs"] == 18470.0
        assert resultado["geracao_mensal_kwh"] == 299.84
        assert resultado["economia_mensal_rs"] == 234.85
        assert resultado["payback_meses"] == 78.65
        assert resultado["payback_anos"] == 6.55
        assert resultado["economia_anual_rs"] == 2818.16
        assert resultado["economia_25_anos_rs"] == 70453.9

    def test_tarifa_energia_invalida(self, dimensionamento):
        with pytest.raises(ValueError, match="tarifa_energia_kwh"):
            CalculoFinanceiroService(
                dimensionamento=dimensionamento,
                tarifa_energia_kwh=0,
                custo_disponibilidade_rs=50,
            )

    def test_economia_liquida_invalida(self, dimensionamento):
        service = CalculoFinanceiroService(
            dimensionamento=dimensionamento,
            tarifa_energia_kwh=0.10,
            custo_disponibilidade_rs=1000,
        )

        with pytest.raises(ValueError, match="economia suficiente"):
            service.calcular()
