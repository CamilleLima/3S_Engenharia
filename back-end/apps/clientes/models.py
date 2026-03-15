from django.core.validators import MinLengthValidator, RegexValidator
from django.db import models


class Vendedor(models.Model):
    """Modelo para representar os vendedores da 3S Engenharia."""

    nome = models.CharField(
        max_length=150,
        verbose_name="Nome",
        help_text="Nome completo do vendedor",
    )
    cargo = models.CharField(
        max_length=100,
        verbose_name="Cargo",
        help_text="Cargo/função do vendedor na empresa",
    )
    telefone = models.CharField(
        max_length=15,
        verbose_name="Telefone",
        validators=[
            RegexValidator(
                regex=r"^\d{10,11}$",
                message="Telefone deve conter 10 ou 11 dígitos numéricos "
                "(apenas números)",
            )
        ],
        help_text="Telefone com DDD (somente números)",
    )
    email = models.EmailField(
        unique=True,
        verbose_name="E-mail",
        help_text="E-mail corporativo do vendedor",
    )
    ativo = models.BooleanField(
        default=True,
        verbose_name="Ativo",
        help_text="Indica se o vendedor está ativo no sistema",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        verbose_name = "Vendedor"
        verbose_name_plural = "Vendedores"
        ordering = ["nome"]
        db_table = "vendedores"

    def __str__(self):
        return f"{self.nome} - {self.cargo}"


class Cliente(models.Model):
    """Modelo para representar os clientes da 3S Engenharia."""

    TIPO_LIGACAO_CHOICES = [
        ("monofasico", "Monofásico"),
        ("bifasico", "Bifásico"),
        ("trifasico", "Trifásico"),
    ]

    TIPO_TELHADO_CHOICES = [
        ("ceramico", "Cerâmico"),
        ("metalico", "Metálico"),
        ("laje", "Laje"),
        ("fibrocimento", "Fibrocimento"),
    ]

    # Dados pessoais
    nome = models.CharField(
        max_length=150,
        verbose_name="Nome",
        help_text="Nome completo do cliente",
    )
    cpf = models.CharField(
        max_length=11,
        unique=True,
        verbose_name="CPF",
        validators=[
            MinLengthValidator(11, "CPF deve conter 11 dígitos"),
            RegexValidator(
                regex=r"^\d{11}$",
                message="CPF deve conter apenas números",
            ),
        ],
        help_text="CPF do cliente (somente números)",
    )
    telefone = models.CharField(
        max_length=15,
        blank=True,
        verbose_name="Telefone",
        validators=[
            RegexValidator(
                regex=r"^\d{10,11}$",
                message="Telefone deve conter 10 ou 11 dígitos numéricos",
            )
        ],
        help_text="Telefone com DDD (opcional)",
    )
    email = models.EmailField(
        blank=True,
        verbose_name="E-mail",
        help_text="E-mail do cliente (opcional)",
    )

    # Endereço
    cep = models.CharField(
        max_length=8,
        verbose_name="CEP",
        validators=[
            MinLengthValidator(8, "CEP deve conter 8 dígitos"),
            RegexValidator(
                regex=r"^\d{8}$",
                message="CEP deve conter apenas números",
            ),
        ],
        help_text="CEP da residência (somente números)",
    )
    rua = models.CharField(
        max_length=200,
        verbose_name="Rua/Logradouro",
        help_text="Preenchido automaticamente via CEP",
    )
    bairro = models.CharField(
        max_length=100,
        verbose_name="Bairro",
        help_text="Preenchido automaticamente via CEP",
    )
    cidade = models.CharField(
        max_length=100,
        verbose_name="Cidade",
        help_text="Preenchido automaticamente via CEP",
    )
    estado = models.CharField(
        max_length=2,
        verbose_name="Estado (UF)",
        help_text="Preenchido automaticamente via CEP",
    )
    numero = models.CharField(
        max_length=10,
        verbose_name="Número",
        help_text="Número da residência",
    )

    # Dados técnicos
    consumo_kwh_mes = models.PositiveIntegerField(
        verbose_name="Consumo (kWh/mês)",
        help_text="Consumo médio mensal em kWh conforme conta de energia",
    )
    tipo_ligacao = models.CharField(
        max_length=20,
        choices=TIPO_LIGACAO_CHOICES,
        verbose_name="Tipo de Ligação",
        help_text="Tipo de ligação elétrica da residência",
    )
    tipo_telhado = models.CharField(
        max_length=20,
        choices=TIPO_TELHADO_CHOICES,
        verbose_name="Tipo de Telhado",
        help_text="Material do telhado para instalação dos painéis",
    )

    # Relacionamento
    vendedor = models.ForeignKey(
        Vendedor,
        on_delete=models.PROTECT,
        related_name="clientes",
        verbose_name="Vendedor",
        help_text="Vendedor responsável pelo atendimento",
    )

    # Auditoria
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ["-created_at"]
        db_table = "clientes"

    def __str__(self):
        return f"{self.nome} - {self.cpf}"

    @property
    def endereco_completo(self):
        """Retorna o endereço completo formatado."""
        return f"{self.rua}, {self.numero} - {self.bairro}, {self.cidade}/{self.estado}"
