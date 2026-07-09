from decimal import Decimal

import pytest

from apps.dimensionamento.geolocation import EstacaoSolar, GeoLocationService
from apps.dimensionamento.reference_data import (
    TIPOS_REDE_ELETRICA,
    obter_fator_perda_por_uf,
)
from apps.dimensionamento.services import (
    DimensionamentoComGeolocalizacaoService,
    DimensionamentoOrcamentoService,
)


def payload_base(**overrides):
    payload = {
        "consumos_mensais": [300.0] * 12,
        "irradiacao_media_cidade": 4.56,
        "fator_perda_decimal": 0.22,
        "custo_kit": 12200.0,
        "custo_adicionais": 2000.0,
        "margem_lucro_decimal": 0.35,
        "imposto_servico_decimal": 0.07,
        "taxa_juros_mensal_decimal": 0.009,
    }
    payload.update(overrides)
    return payload


class TestDimensionamentoOrcamentoService:
    def test_caso_nominal(self):
        service = DimensionamentoOrcamentoService(**payload_base())

        resultado = service.calcular()

        assert resultado["potencia_calculada_kwp"] == 2.81
        assert resultado["valor_total_sistema"] == 18470.0
        assert resultado["lucro_liquido_empresa"] == 3971.1
        assert set(resultado["financiamento_parcelas"].keys()) == {
            "12",
            "24",
            "36",
            "48",
            "60",
        }

    def test_taxa_juros_zero(self):
        service = DimensionamentoOrcamentoService(
            **payload_base(
                taxa_juros_mensal_decimal=0,
                custo_kit=1200,
                custo_adicionais=0,
                margem_lucro_decimal=0,
                imposto_servico_decimal=0,
            )
        )

        resultado = service.calcular()

        assert resultado["valor_total_sistema"] == 1200.0
        assert resultado["financiamento_parcelas"]["12"] == 100.0
        assert resultado["financiamento_parcelas"]["60"] == 20.0

    def test_irradiacao_zero_deve_falhar(self):
        with pytest.raises(ValueError, match="irradiacao_media_cidade"):
            DimensionamentoOrcamentoService(**payload_base(irradiacao_media_cidade=0))

    def test_fator_perda_invalido_deve_falhar(self):
        with pytest.raises(ValueError, match="fator_perda_decimal"):
            DimensionamentoOrcamentoService(**payload_base(fator_perda_decimal=1))

    def test_lista_consumo_com_tamanho_invalido(self):
        with pytest.raises(ValueError, match="12 valores"):
            DimensionamentoOrcamentoService(**payload_base(consumos_mensais=[100] * 11))

    def test_arredondamento_financeiro_duas_casas(self):
        service = DimensionamentoOrcamentoService(**payload_base())
        resultado = service.calcular()

        for valor in [
            resultado["potencia_calculada_kwp"],
            resultado["valor_total_sistema"],
            resultado["lucro_liquido_empresa"],
        ]:
            decimal = Decimal(str(valor))
            assert decimal.as_tuple().exponent >= -2


class TestReferenciaGeografica:
    def test_obter_fator_perda_por_uf(self):
        assert obter_fator_perda_por_uf("ac") == Decimal("0.08")
        assert obter_fator_perda_por_uf("RS") == Decimal("0.29")

    def test_uf_sem_referencia_deve_falhar(self):
        with pytest.raises(ValueError, match="UF sem fator de perda"):
            obter_fator_perda_por_uf("SP")

    def test_tipos_rede_eletrica_reaproveitam_clientes(self):
        assert TIPOS_REDE_ELETRICA["monofasico"] == "Monofásica"
        assert TIPOS_REDE_ELETRICA["bifasico"] == "Bifásica"
        assert TIPOS_REDE_ELETRICA["trifasico"] == "Trifásica"


class TestGeoLocationService:
    def test_calcular_inclinacao_ideal_modulo_latitude(self):
        assert GeoLocationService.calcular_inclinacao_ideal(-9.97) == 9.97

    def test_buscar_estacao_mais_proxima(self):
        estacoes = [
            EstacaoSolar(id="E1", latitude=-9.90, longitude=-67.80, irradiacao=4.20),
            EstacaoSolar(id="E2", latitude=-9.97, longitude=-67.81, irradiacao=4.56),
            EstacaoSolar(id="E3", latitude=-10.30, longitude=-67.90, irradiacao=5.01),
        ]

        estacao, distancia = GeoLocationService.buscar_estacao_mais_proxima(
            lat_cliente=-9.98,
            lon_cliente=-67.82,
            estacoes=estacoes,
        )

        assert estacao.id == "E2"
        assert distancia >= 0


class TestDimensionamentoComGeolocalizacaoService:
    def test_fluxo_completo_consumo_uf_coordenadas(self):
        estacoes = [
            EstacaoSolar(id="E-AC", latitude=-9.97, longitude=-67.81, irradiacao=4.56),
            EstacaoSolar(id="E-RO", latitude=-8.75, longitude=-63.90, irradiacao=5.10),
        ]
        service = DimensionamentoComGeolocalizacaoService()

        resultado = service.calcular_orcamento(
            consumo_kwh_mes=300,
            uf="AC",
            latitude_cliente=-9.98,
            longitude_cliente=-67.82,
            estacoes_solares=estacoes,
            custo_kit=12200,
            custo_adicionais=2000,
            margem_lucro_decimal=0.35,
            imposto_servico_decimal=0.07,
            taxa_juros_mensal_decimal=0.009,
        )

        assert resultado["uf"] == "AC"
        assert resultado["fator_perda_decimal"] == 0.08
        assert resultado["irradiacao_media_cidade"] == 4.56
        assert resultado["estacao_mais_proxima"]["id"] == "E-AC"
        assert resultado["inclinacao_ideal_graus"] == 9.98
        assert resultado["valor_total_sistema"] == 18470.0

    def test_fluxo_minimo_com_parametros_padrao(self):
        estacoes = [
            EstacaoSolar(id="E-AC", latitude=-9.97, longitude=-67.81, irradiacao=4.56),
        ]
        service = DimensionamentoComGeolocalizacaoService()

        resultado = service.calcular_orcamento(
            consumo_kwh_mes=300,
            uf="AC",
            latitude_cliente=-9.98,
            longitude_cliente=-67.82,
            estacoes_solares=estacoes,
        )

        assert resultado["valor_total_sistema"] == 18470.0
        assert resultado["lucro_liquido_empresa"] == 3971.1
