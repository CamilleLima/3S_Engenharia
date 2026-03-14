from django.contrib import admin

from .models import Cliente, Vendedor


@admin.register(Vendedor)
class VendedorAdmin(admin.ModelAdmin):
    """Interface administrativa para o modelo Vendedor."""

    list_display = ["nome", "cargo", "email", "telefone", "ativo", "created_at"]
    search_fields = ["nome", "email", "cargo"]
    list_filter = ["ativo", "cargo", "created_at"]
    ordering = ["nome"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = [
        (
            "Informações Pessoais",
            {"fields": ["nome", "cargo", "telefone", "email"]},
        ),
        ("Status", {"fields": ["ativo"]}),
        (
            "Auditoria",
            {
                "fields": ["created_at", "updated_at"],
                "classes": ["collapse"],
            },
        ),
    ]


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    """Interface administrativa para o modelo Cliente."""

    list_display = [
        "nome",
        "cpf",
        "cidade",
        "estado",
        "consumo_kwh_mes",
        "vendedor",
        "created_at",
    ]
    search_fields = ["nome", "cpf", "email", "cidade"]
    list_filter = ["estado", "tipo_ligacao", "tipo_telhado", "created_at"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at", "endereco_completo"]
    autocomplete_fields = ["vendedor"]

    fieldsets = [
        (
            "Dados Pessoais",
            {"fields": ["nome", "cpf", "telefone", "email"]},
        ),
        (
            "Endereço",
            {
                "fields": [
                    "cep",
                    "rua",
                    "numero",
                    "bairro",
                    "cidade",
                    "estado",
                    "endereco_completo",
                ]
            },
        ),
        (
            "Dados Técnicos",
            {"fields": ["consumo_kwh_mes", "tipo_ligacao", "tipo_telhado"]},
        ),
        ("Vendedor Responsável", {"fields": ["vendedor"]}),
        (
            "Auditoria",
            {
                "fields": ["created_at", "updated_at"],
                "classes": ["collapse"],
            },
        ),
    ]

