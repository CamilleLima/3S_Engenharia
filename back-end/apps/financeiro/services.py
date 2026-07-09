from decimal import ROUND_HALF_UP, Decimal


DecimalInput = Decimal | int | float | str


class CalculoFinanceiroService:
    """Serviço de cálculo de payback/ROI baseado no dimensionamento."""

    GERACAO_EXCEDENTE_DECIMAL = Decimal("0.10")

    def __init__(
        self,
        dimensionamento,
        tarifa_energia_kwh: DecimalInput,
        custo_disponibilidade_rs: DecimalInput = Decimal("50.00"),
    ):
        self.dimensionamento = dimensionamento
        self.tarifa_energia_kwh = self._to_decimal(tarifa_energia_kwh)
        self.custo_disponibilidade_rs = self._to_decimal(custo_disponibilidade_rs)

        self._validar_entrada()

    @staticmethod
    def _to_decimal(valor: DecimalInput) -> Decimal:
        return Decimal(str(valor))

    @staticmethod
    def _round_money(valor: Decimal) -> Decimal:
        return valor.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def _validar_entrada(self):
        if self.tarifa_energia_kwh <= 0:
            raise ValueError("tarifa_energia_kwh deve ser maior que zero.")

        if self.custo_disponibilidade_rs < 0:
            raise ValueError("custo_disponibilidade_rs não pode ser negativo.")

    def calcular(self):
        investimento_total = self._to_decimal(self.dimensionamento.valor_total_sistema)
        consumo_medio_mensal = self._to_decimal(
            self.dimensionamento.cliente.consumo_kwh_mes
        )
        geracao_mensal_kwh = consumo_medio_mensal * (
            Decimal("1") + self.GERACAO_EXCEDENTE_DECIMAL
        )
        economia_bruta_mensal = geracao_mensal_kwh * self.tarifa_energia_kwh
        economia_liquida_mensal = economia_bruta_mensal - self.custo_disponibilidade_rs

        if economia_liquida_mensal <= 0:
            raise ValueError(
                "O sistema dimensionado não gera economia suficiente para cobrir "
                "o custo de disponibilidade."
            )

        payback_meses = investimento_total / economia_liquida_mensal
        payback_anos = payback_meses / Decimal("12")
        economia_anual = economia_liquida_mensal * Decimal("12")
        economia_25_anos = economia_anual * Decimal("25")

        return {
            "investimento_total_rs": float(self._round_money(investimento_total)),
            "geracao_mensal_kwh": float(self._round_money(geracao_mensal_kwh)),
            "economia_mensal_rs": float(self._round_money(economia_liquida_mensal)),
            "economia_anual_rs": float(self._round_money(economia_anual)),
            "payback_meses": float(self._round_money(payback_meses)),
            "payback_anos": float(self._round_money(payback_anos)),
            "economia_25_anos_rs": float(self._round_money(economia_25_anos)),
        }
