from django.contrib import admin

from .models import CalculoFinanceiro


@admin.register(CalculoFinanceiro)
class CalculoFinanceiroAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "dimensionamento",
        "tarifa_energia_kwh",
        "investimento_total_rs",
        "economia_mensal_rs",
        "payback_meses",
        "created_at",
    ]
    search_fields = ["dimensionamento__cliente__nome", "dimensionamento__id"]
    list_filter = ["created_at"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]
