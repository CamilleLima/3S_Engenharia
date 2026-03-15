from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class CalculoFinanceiro(models.Model):
    """Armazena o resultado de payback/ROI baseado em um dimensionamento."""

    dimensionamento = models.ForeignKey(
        "dimensionamento.Dimensionamento",
        on_delete=models.PROTECT,
        related_name="calculos_financeiros",
        verbose_name="Dimensionamento",
    )

    # Entradas
    tarifa_energia_kwh = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        validators=[MinValueValidator(Decimal("0.0001"))],
        verbose_name="Tarifa de Energia (R$/kWh)",
    )
    custo_disponibilidade_rs = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("50.00"),
        validators=[MinValueValidator(Decimal("0"))],
        verbose_name="Custo de Disponibilidade (R$)",
    )

    # Saídas
    investimento_total_rs = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Investimento Total (R$)",
    )
    geracao_mensal_kwh = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Geração Mensal (kWh)",
    )
    economia_mensal_rs = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Economia Mensal (R$)",
    )
    economia_anual_rs = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Economia Anual (R$)",
    )
    payback_meses = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Payback (meses)",
    )
    payback_anos = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Payback (anos)",
    )
    economia_25_anos_rs = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        verbose_name="Economia em 25 anos (R$)",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Cálculo Financeiro"
        verbose_name_plural = "Cálculos Financeiros"
        ordering = ["-created_at"]
        db_table = "calculos_financeiros"

    def __str__(self):
        return f"Financeiro #{self.pk} - Dimensionamento #{self.dimensionamento_id}"
