from __future__ import annotations

from copy import deepcopy
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from apps.dimensionamento.models import Dimensionamento
    from apps.financeiro.models import CalculoFinanceiro


DEFAULT_PREVIEW_TEMPLATE_DATA = {
    "editable": {
        "companyName": "3S Engenharia",
        "companyCnpj": "30.635.438/0001-07",
        "proposalTitle": "Proposta Comercial Sistema Energia Solar",
        "proposalDate": "",
        "validityDays": "7",
        "responsibleName": "",
        "responsibleContact": "",
        "clientName": "",
        "clientCityUf": "",
        "clientPhone": "",
        "clientEmail": "",
        "investmentValue": "",
        "monthlySavings": "",
        "yearlySavings": "",
        "paybackYears": "",
        "consumptionKwh": "",
        "monthlyGenerationKwh": "",
        "moduleModel": "DMEGC",
        "moduleManufacturer": "DMEGC610WP",
        "modulePowerWp": "610",
        "moduleWeightKg": "35",
        "numberOfPanels": "",
        "inverterModel1": "PHB 6000",
        "inverterManufacturer1": "PHB",
        "inverterPowerKw1": "6",
        "inverterWarrantyYears1": "10",
        "inverterModel2": "",
        "inverterManufacturer2": "",
        "inverterPowerKw2": "",
        "inverterWarrantyYears2": "",
        "generationWarning": (
            "IMPORTANTE: Os valores de geração e economia são estimativas "
            "baseadas no consumo informado, irradiação média da região e "
            "condições de projeto. Os resultados reais podem variar conforme "
            "clima, sombreamento, orientação dos módulos e variações tarifárias."
        ),
        "financialWarning": (
            "AVISO IMPORTANTE: Os valores de economia e payback são estimativas "
            "baseadas no consumo informado, na tarifa de energia e na geração "
            "estimada do sistema. A economia real dependerá do consumo efetivo, "
            "das variações tarifárias e da geração real."
        ),
        "contractTerms": (
            "Declaro que li e concordo com os termos desta proposta comercial para "
            "instalação de sistema de energia solar.\n\n"
            "Validade da proposta: 7 dias a partir da data de emissão.\n\n"
            "As garantias dos equipamentos seguem os respectivos fabricantes. "
            "A garantia dos serviços de instalação segue o contrato firmado "
            "entre as partes."
        ),
        "includedServices": (
            "Vistoria técnica\n"
            "Projeto elétrico\n"
            "ART de projeto e instalação\n"
            "Homologação junto à concessionária\n"
            "Instalação dos módulos e inversores\n"
            "Comissionamento do sistema"
        ),
    },
    "services": [
        "Vistoria técnica",
        "Projeto elétrico",
        "ART de projeto e instalação",
        "Homologação junto à concessionária",
        "Instalação dos módulos e inversores",
        "Comissionamento do sistema",
    ],
    "servicesNote": (
        "Não Estão Inclusos Obras Civis e Eventuais Reformas "
        "No Telhado/Laje e no Padrão de Entrada"
    ),
    "acceptanceText": (
        "Declaro que li e concordo com os termos desta proposta comercial "
        "para instalação de sistema de energia solar."
    ),
    "validityText": "Esta proposta tem validade de 7 dias a partir da data de emissão",
    "signatureClientName": "",
    "moduleWarrantyProduct": "12 anos contra defeitos de fabricação",
    "moduleWarrantyPerformance": "25 anos",
    "moduleWarrantyYear1": "97% da potência nominal no primeiro ano",
    "moduleWarrantyYear25": "80% da potência nominal após 25 anos",
    "installationWarranty": "5 anos",
    "installationWarrantyText": (
        "Cobertura de serviços de instalação, fixação e conexões elétricas"
    ),
    "clarifications": [
        (
            "* As estimativas de geração e economia foram baseadas no consumo "
            "apresentado e no estudo de irradiação local."
        ),
        (
            "** Os valores apresentados são estimativas e podem variar "
            "conforme fatores meteorológicos."
        ),
        (
            "*** O sistema foi projetado considerando o perfil de consumo "
            "atual do cliente."
        ),
    ],
    "monthlyGenerationData": [
        {"month": "JAN", "generation": 843.06, "irradiation": 4.47},
        {"month": "FEV", "generation": 869.09, "irradiation": 4.608},
        {"month": "MAR", "generation": 795.16, "irradiation": 4.216},
        {"month": "ABR", "generation": 832.5, "irradiation": 4.414},
        {"month": "MAI", "generation": 744.23, "irradiation": 3.946},
        {"month": "JUN", "generation": 771.01, "irradiation": 4.088},
        {"month": "JUL", "generation": 804.02, "irradiation": 4.265},
        {"month": "AGO", "generation": 917.75, "irradiation": 4.866},
        {"month": "SET", "generation": 962.63, "irradiation": 5.104},
        {"month": "OUT", "generation": 962.82, "irradiation": 5.105},
        {"month": "NOV", "generation": 949.62, "irradiation": 5.035},
        {"month": "DEZ", "generation": 868.71, "irradiation": 4.606},
    ],
}


def get_default_preview_template_data() -> dict:
    return deepcopy(DEFAULT_PREVIEW_TEMPLATE_DATA)


def _deep_merge(base: dict, override: dict) -> dict:
    merged = deepcopy(base)
    for key, value in override.items():
        if (
            key in merged
            and isinstance(merged[key], dict)
            and isinstance(value, dict)
        ):
            merged[key] = _deep_merge(merged[key], value)
        else:
            merged[key] = deepcopy(value)
    return merged


def _format_brl(value: Decimal | float | int | None) -> str:
    if value is None:
        return ""
    number = float(value)
    formatted = f"{number:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {formatted}"


def _round(value: Decimal | float, digits: int) -> float:
    return round(float(value), digits)


def _monthly_generation_from_consumption(dimensionamento: Dimensionamento) -> float:
    consumo_medio_mensal = Decimal(str(dimensionamento.cliente.consumo_kwh_mes))
    return _round(consumo_medio_mensal * Decimal("1.10"), 2)


def _build_monthly_generation_data(
    *,
    dimensionamento: Dimensionamento,
    calculo_financeiro: CalculoFinanceiro | None,
) -> list[dict[str, float | str]]:
    months = [
        "JAN",
        "FEV",
        "MAR",
        "ABR",
        "MAI",
        "JUN",
        "JUL",
        "AGO",
        "SET",
        "OUT",
        "NOV",
        "DEZ",
    ]

    irradiation = _round(dimensionamento.irradiacao_media_cidade, 3)

    if calculo_financeiro:
        monthly_generation = _round(calculo_financeiro.geracao_mensal_kwh, 2)
    else:
        monthly_generation = _monthly_generation_from_consumption(dimensionamento)

    return [
        {
            "month": month,
            "generation": monthly_generation,
            "irradiation": irradiation,
        }
        for month in months
    ]


def build_initial_preview_state(
    *,
    dimensionamento: Dimensionamento,
    calculo_financeiro: CalculoFinanceiro | None,
    template_data: dict | None = None,
) -> dict:
    base = get_default_preview_template_data()
    if template_data:
        base = _deep_merge(base, template_data)

    cliente = dimensionamento.cliente
    today = datetime.now().strftime("%d/%m/%Y")

    editable = deepcopy(base.get("editable", {}))
    editable["proposalDate"] = today
    editable["responsibleName"] = cliente.vendedor.nome
    editable["clientName"] = cliente.nome
    editable["clientCityUf"] = f"{cliente.cidade}/{cliente.estado}"
    editable["clientPhone"] = cliente.telefone or "Não informado"
    editable["clientEmail"] = cliente.email or "Não informado"
    editable["investmentValue"] = _format_brl(dimensionamento.valor_total_sistema)
    editable["consumptionKwh"] = str(cliente.consumo_kwh_mes or "")

    if calculo_financeiro:
        editable["monthlySavings"] = _format_brl(calculo_financeiro.economia_mensal_rs)
        editable["yearlySavings"] = _format_brl(calculo_financeiro.economia_anual_rs)
        editable["paybackYears"] = f"{float(calculo_financeiro.payback_anos):.2f} anos"
        editable["monthlyGenerationKwh"] = str(
            float(calculo_financeiro.geracao_mensal_kwh)
        )
    else:
        editable["monthlyGenerationKwh"] = str(
            _monthly_generation_from_consumption(dimensionamento)
        )

    services = base.get("services", [])
    editable["includedServices"] = "\n".join(services)

    base.update(
        {
            "editable": editable,
            "services": services,
            "signatureClientName": base.get("signatureClientName") or cliente.nome,
            "monthlyGenerationData": _build_monthly_generation_data(
                dimensionamento=dimensionamento,
                calculo_financeiro=calculo_financeiro,
            ),
        }
    )
    return base


MUTABLE_EDITABLE_KEYS = {
    "companyName",
    "companyCnpj",
    "proposalTitle",
    "proposalDate",
    "validityDays",
    "responsibleContact",
    "moduleModel",
    "moduleManufacturer",
    "modulePowerWp",
    "moduleWeightKg",
    "numberOfPanels",
    "inverterModel1",
    "inverterManufacturer1",
    "inverterPowerKw1",
    "inverterWarrantyYears1",
    "inverterModel2",
    "inverterManufacturer2",
    "inverterPowerKw2",
    "inverterWarrantyYears2",
    "generationWarning",
    "financialWarning",
    "contractTerms",
    "includedServices",
}

MUTABLE_TOP_LEVEL_KEYS = {
    "services",
    "servicesNote",
    "acceptanceText",
    "validityText",
    "signatureClientName",
    "moduleWarrantyProduct",
    "moduleWarrantyPerformance",
    "moduleWarrantyYear1",
    "moduleWarrantyYear25",
    "installationWarranty",
    "installationWarrantyText",
    "clarifications",
}


def merge_mutable_preview_fields(base_state: dict, incoming_state: dict | None) -> dict:
    """Mescla apenas campos editáveis do preview em cima de um estado base."""

    if not isinstance(incoming_state, dict):
        return base_state

    merged = deepcopy(base_state)
    editable_base = merged.get("editable", {})
    editable_incoming = incoming_state.get("editable", {})

    if isinstance(editable_base, dict) and isinstance(editable_incoming, dict):
        for key in MUTABLE_EDITABLE_KEYS:
            if key in editable_incoming:
                editable_base[key] = editable_incoming[key]

    for key in MUTABLE_TOP_LEVEL_KEYS:
        if key in incoming_state:
            merged[key] = deepcopy(incoming_state[key])

    services = merged.get("services", [])
    if isinstance(services, list) and isinstance(editable_base, dict):
        editable_base["includedServices"] = "\n".join(str(item) for item in services)

    return merged


def sanitize_preview_state_payload(payload: Any) -> dict:
    """Garante que payload inválido não quebre o fluxo de atualização."""

    if not isinstance(payload, dict):
        return {}
    return payload
