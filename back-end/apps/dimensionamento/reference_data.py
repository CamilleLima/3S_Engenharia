from decimal import Decimal

from .geolocation import EstacaoSolar

# Fonte estática de referência para perdas por estado (UF).
PERDAS_POR_UF: dict[str, Decimal] = {
    "AC": Decimal("0.08"),
    "AL": Decimal("0.09"),
    "AP": Decimal("0.10"),
    "AM": Decimal("0.11"),
    "BA": Decimal("0.12"),
    "CE": Decimal("0.13"),
    "DF": Decimal("0.14"),
    "ES": Decimal("0.15"),
    "GO": Decimal("0.16"),
    "MA": Decimal("0.17"),
    "MT": Decimal("0.18"),
    "MS": Decimal("0.19"),
    "MG": Decimal("0.21"),
    "PA": Decimal("0.22"),
    "PB": Decimal("0.23"),
    "PR": Decimal("0.24"),
    "PE": Decimal("0.25"),
    "PI": Decimal("0.26"),
    "RJ": Decimal("0.27"),
    "RN": Decimal("0.28"),
    "RS": Decimal("0.29"),
    "RO": Decimal("0.30"),
}

TIPOS_REDE_ELETRICA: dict[str, str] = {
    "monofasico": "Monofásica",
    "bifasico": "Bifásica",
    "trifasico": "Trifásica",
}

# Estações solares de referência (mock para etapa 2).
ESTACOES_SOLARES_REFERENCIA: list[EstacaoSolar] = [
    EstacaoSolar(id="EST-AC-001", latitude=-9.97, longitude=-67.81, irradiacao=4.56),
    EstacaoSolar(id="EST-RO-001", latitude=-8.76, longitude=-63.90, irradiacao=5.10),
    EstacaoSolar(id="EST-BA-001", latitude=-12.98, longitude=-38.50, irradiacao=5.45),
    EstacaoSolar(id="EST-RJ-001", latitude=-22.91, longitude=-43.20, irradiacao=4.85),
]

# Parâmetros financeiros default para quando a entrada é apenas consumo+UF+coordenadas.
PARAMETROS_FINANCEIROS_PADRAO = {
    "custo_kit": Decimal("12200.00"),
    "custo_adicionais": Decimal("2000.00"),
    "margem_lucro_decimal": Decimal("0.35"),
    "imposto_servico_decimal": Decimal("0.07"),
    "taxa_juros_mensal_decimal": Decimal("0.009"),
}


def obter_fator_perda_por_uf(uf: str) -> Decimal:
    uf_normalizada = (uf or "").strip().upper()
    try:
        return PERDAS_POR_UF[uf_normalizada]
    except KeyError as exc:
        raise ValueError(f"UF sem fator de perda cadastrado: {uf_normalizada}") from exc


def obter_estacoes_solares_referencia() -> list[EstacaoSolar]:
    return ESTACOES_SOLARES_REFERENCIA
