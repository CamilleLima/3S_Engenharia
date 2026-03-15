from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Dimensionamento(models.Model):
    """Armazena entradas e saídas do cálculo de dimensionamento/orçamento."""

    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pendente"),
        (STATUS_ACCEPTED, "Aceita"),
        (STATUS_REJECTED, "Recusada"),
    ]

    cliente = models.ForeignKey(
        "clientes.Cliente",
        on_delete=models.PROTECT,
        related_name="dimensionamentos",
        verbose_name="Cliente",
    )

    # Entradas
    consumos_mensais = models.JSONField(verbose_name="Consumos Mensais (12 meses)")
    irradiacao_media_cidade = models.DecimalField(
        max_digits=8,
        decimal_places=4,
        validators=[MinValueValidator(Decimal("0.0001"))],
        verbose_name="Irradiação Média da Cidade",
    )
    fator_perda_decimal = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        validators=[
            MinValueValidator(Decimal("0")),
            MaxValueValidator(Decimal("0.9999")),
        ],
        verbose_name="Fator de Perda Decimal",
    )
    custo_kit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
        verbose_name="Custo do Kit",
    )
    custo_adicionais = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
        verbose_name="Custo de Adicionais",
    )
    margem_lucro_decimal = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        validators=[MinValueValidator(Decimal("0"))],
        verbose_name="Margem de Lucro Decimal",
    )
    imposto_servico_decimal = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        validators=[MinValueValidator(Decimal("0"))],
        verbose_name="Imposto de Serviço Decimal",
    )
    taxa_juros_mensal_decimal = models.DecimalField(
        max_digits=8,
        decimal_places=6,
        validators=[MinValueValidator(Decimal("0"))],
        verbose_name="Taxa de Juros Mensal Decimal",
    )

    # Saídas
    potencia_calculada_kwp = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Potência Calculada (kWp)",
    )
    valor_total_sistema = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Valor Total do Sistema",
    )
    lucro_liquido_empresa = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Lucro Líquido da Empresa",
    )
    financiamento_parcelas = models.JSONField(verbose_name="Parcelas Financiamento")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        verbose_name="Status da Proposta",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Dimensionamento"
        verbose_name_plural = "Dimensionamentos"
        ordering = ["-created_at"]
        db_table = "dimensionamentos"

    def __str__(self):
        return f"Dimensionamento #{self.pk} - {self.cliente.nome}"
