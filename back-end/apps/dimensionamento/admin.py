from django.contrib import admin

from .models import Dimensionamento


@admin.register(Dimensionamento)
class DimensionamentoAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "cliente",
        "potencia_calculada_kwp",
        "valor_total_sistema",
        "lucro_liquido_empresa",
        "created_at",
    ]
    search_fields = ["cliente__nome", "cliente__cpf"]
    list_filter = ["created_at", "cliente__cidade", "cliente__estado"]
    readonly_fields = ["created_at", "updated_at"]
