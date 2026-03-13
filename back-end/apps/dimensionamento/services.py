from decimal import ROUND_HALF_UP, Decimal

from .geolocation import EstacaoSolar, GeoLocationService
from .reference_data import (
    PARAMETROS_FINANCEIROS_PADRAO,
    obter_fator_perda_por_uf,
)


class DimensionamentoOrcamentoService:
    """Serviço principal para cálculo de dimensionamento e orçamento."""

    PRAZOS_FINANCIAMENTO = (12, 24, 36, 48, 60)

    def __init__(
        self,
        consumos_mensais,
        irradiacao_media_cidade,
        fator_perda_decimal,
        custo_kit,
        custo_adicionais,
        margem_lucro_decimal,
        imposto_servico_decimal,
        taxa_juros_mensal_decimal,
    ):
        self.consumos_mensais = [self._to_decimal(v) for v in consumos_mensais]
        self.irradiacao_media_cidade = self._to_decimal(irradiacao_media_cidade)
        self.fator_perda_decimal = self._to_decimal(fator_perda_decimal)
        self.custo_kit = self._to_decimal(custo_kit)
        self.custo_adicionais = self._to_decimal(custo_adicionais)
        self.margem_lucro_decimal = self._to_decimal(margem_lucro_decimal)
        self.imposto_servico_decimal = self._to_decimal(imposto_servico_decimal)
        self.taxa_juros_mensal_decimal = self._to_decimal(taxa_juros_mensal_decimal)

        self._validar_entrada()

    @staticmethod
    def _to_decimal(valor):
        return Decimal(str(valor))

    @staticmethod
    def _round_money(valor):
        return valor.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def _validar_entrada(self):
        if len(self.consumos_mensais) != 12:
            raise ValueError("consumos_mensais deve conter exatamente 12 valores.")

        if any(v < 0 for v in self.consumos_mensais):
            raise ValueError("consumos_mensais não pode conter valores negativos.")

        if self.irradiacao_media_cidade <= 0:
            raise ValueError("irradiacao_media_cidade deve ser maior que zero.")

        if self.fator_perda_decimal < 0 or self.fator_perda_decimal >= 1:
            raise ValueError("fator_perda_decimal deve estar entre 0 e menor que 1.")

        if self.custo_kit < 0 or self.custo_adicionais < 0:
            raise ValueError("custos não podem ser negativos.")

        if (
            self.margem_lucro_decimal < 0
            or self.imposto_servico_decimal < 0
            or self.taxa_juros_mensal_decimal < 0
        ):
            raise ValueError("margem, imposto e taxa de juros não podem ser negativos.")

    def calcular(self):
        # Passo A: Cálculo de Consumo e Potência
        consumo_medio_mensal = sum(self.consumos_mensais) / Decimal("12")
        consumo_medio_diario = consumo_medio_mensal / Decimal("30")

        denominador = self.irradiacao_media_cidade * (
            Decimal("1") - self.fator_perda_decimal
        )
        if denominador <= 0:
            raise ValueError("Denominador inválido no cálculo de potência mínima.")

        # potencia_minima_sistema_kwp = consumo_medio_diario /
        # (irradiacao_media_cidade * (1 - fator_perda_decimal))
        potencia_minima_sistema_kwp = consumo_medio_diario / denominador

        # Passo B: Composição Financeira e Orçamento
        # valor_lucro_bruto = custo_kit * margem_lucro_decimal
        valor_lucro_bruto = self.custo_kit * self.margem_lucro_decimal

        # valor_total_sistema = custo_kit + custo_adicionais + valor_lucro_bruto
        valor_total_sistema = self.custo_kit + self.custo_adicionais + valor_lucro_bruto

        # lucro_liquido_empresa = valor_lucro_bruto -
        # (valor_lucro_bruto * imposto_servico_decimal)
        lucro_liquido_empresa = valor_lucro_bruto - (
            valor_lucro_bruto * self.imposto_servico_decimal
        )

        # Passo C: Financiamento (Tabela Price)
        financiamento_parcelas = self._calcular_financiamento_price(valor_total_sistema)

        return {
            "potencia_calculada_kwp": float(
                self._round_money(potencia_minima_sistema_kwp)
            ),
            "valor_total_sistema": float(self._round_money(valor_total_sistema)),
            "lucro_liquido_empresa": float(self._round_money(lucro_liquido_empresa)),
            "financiamento_parcelas": financiamento_parcelas,
        }

    def _calcular_financiamento_price(self, valor_presente):
        parcelas = {}
        taxa = self.taxa_juros_mensal_decimal

        for meses in self.PRAZOS_FINANCIAMENTO:
            if taxa == 0:
                pmt = valor_presente / Decimal(meses)
            else:
                fator = (Decimal("1") + taxa) ** meses
                denominador = fator - Decimal("1")
                if denominador == 0:
                    raise ValueError("Divisão por zero no cálculo da Tabela Price.")

                # PMT = PV * ((i * (1 + i)^n) / ((1 + i)^n - 1))
                pmt = valor_presente * ((taxa * fator) / denominador)

            parcelas[str(meses)] = float(self._round_money(pmt))

        return parcelas


class DimensionamentoComGeolocalizacaoService:
    """Orquestra referência geográfica e cálculo financeiro do dimensionamento."""

    def __init__(self, geolocation_service: GeoLocationService | None = None):
        self.geolocation_service = geolocation_service or GeoLocationService()

    @staticmethod
    def _resolver_parametros_financeiros(
        custo_kit: float | None,
        custo_adicionais: float | None,
        margem_lucro_decimal: float | None,
        imposto_servico_decimal: float | None,
        taxa_juros_mensal_decimal: float | None,
    ) -> dict[str, float]:
        return {
            "custo_kit": (
                custo_kit
                if custo_kit is not None
                else float(PARAMETROS_FINANCEIROS_PADRAO["custo_kit"])
            ),
            "custo_adicionais": (
                custo_adicionais
                if custo_adicionais is not None
                else float(PARAMETROS_FINANCEIROS_PADRAO["custo_adicionais"])
            ),
            "margem_lucro_decimal": (
                margem_lucro_decimal
                if margem_lucro_decimal is not None
                else float(PARAMETROS_FINANCEIROS_PADRAO["margem_lucro_decimal"])
            ),
            "imposto_servico_decimal": (
                imposto_servico_decimal
                if imposto_servico_decimal is not None
                else float(PARAMETROS_FINANCEIROS_PADRAO["imposto_servico_decimal"])
            ),
            "taxa_juros_mensal_decimal": (
                taxa_juros_mensal_decimal
                if taxa_juros_mensal_decimal is not None
                else float(PARAMETROS_FINANCEIROS_PADRAO["taxa_juros_mensal_decimal"])
            ),
        }

    def calcular_orcamento(
        self,
        consumo_kwh_mes: float,
        uf: str,
        latitude_cliente: float,
        longitude_cliente: float,
        estacoes_solares: list[EstacaoSolar],
        custo_kit: float | None = None,
        custo_adicionais: float | None = None,
        margem_lucro_decimal: float | None = None,
        imposto_servico_decimal: float | None = None,
        taxa_juros_mensal_decimal: float | None = None,
    ) -> dict:
        parametros = self._resolver_parametros_financeiros(
            custo_kit=custo_kit,
            custo_adicionais=custo_adicionais,
            margem_lucro_decimal=margem_lucro_decimal,
            imposto_servico_decimal=imposto_servico_decimal,
            taxa_juros_mensal_decimal=taxa_juros_mensal_decimal,
        )

        fator_perda_decimal = obter_fator_perda_por_uf(uf)

        estacao_proxima, distancia_km = (
            self.geolocation_service.buscar_estacao_mais_proxima(
                latitude_cliente,
                longitude_cliente,
                estacoes_solares,
            )
        )
        irradiacao_media_cidade = estacao_proxima.irradiacao
        inclinacao_ideal_graus = self.geolocation_service.calcular_inclinacao_ideal(
            latitude_cliente
        )

        service = DimensionamentoOrcamentoService(
            consumos_mensais=[consumo_kwh_mes] * 12,
            irradiacao_media_cidade=irradiacao_media_cidade,
            fator_perda_decimal=fator_perda_decimal,
            custo_kit=parametros["custo_kit"],
            custo_adicionais=parametros["custo_adicionais"],
            margem_lucro_decimal=parametros["margem_lucro_decimal"],
            imposto_servico_decimal=parametros["imposto_servico_decimal"],
            taxa_juros_mensal_decimal=parametros["taxa_juros_mensal_decimal"],
        )
        resultado = service.calcular()

        return {
            "uf": uf.upper(),
            "fator_perda_decimal": float(fator_perda_decimal),
            "irradiacao_media_cidade": float(irradiacao_media_cidade),
            "inclinacao_ideal_graus": round(float(inclinacao_ideal_graus), 2),
            "estacao_mais_proxima": {
                "id": estacao_proxima.id,
                "distancia_km": round(float(distancia_km), 2),
            },
            "parametros_financeiros_utilizados": parametros,
            **resultado,
        }
