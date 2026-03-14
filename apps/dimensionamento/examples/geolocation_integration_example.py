"""Exemplo prático de integração: consumo + UF + coordenadas -> orçamento final."""

from apps.dimensionamento.geolocation import EstacaoSolar
from apps.dimensionamento.services import DimensionamentoComGeolocalizacaoService


def executar_exemplo() -> dict:
    estacoes_solares = [
        EstacaoSolar(
            id="EST-AC-001",
            latitude=-9.97,
            longitude=-67.81,
            irradiacao=4.56,
        ),
        EstacaoSolar(
            id="EST-RO-001",
            latitude=-8.76,
            longitude=-63.90,
            irradiacao=5.10,
        ),
    ]

    service = DimensionamentoComGeolocalizacaoService()

    # Entrada mínima do fluxo da Etapa 2
    return service.calcular_orcamento(
        consumo_kwh_mes=300,
        uf="AC",
        latitude_cliente=-9.98,
        longitude_cliente=-67.82,
        estacoes_solares=estacoes_solares,
        custo_kit=12200,
        custo_adicionais=2000,
        margem_lucro_decimal=0.35,
        imposto_servico_decimal=0.07,
        taxa_juros_mensal_decimal=0.009,
    )


if __name__ == "__main__":
    print(executar_exemplo())
