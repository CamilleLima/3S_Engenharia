from django.contrib import admin

from .models import PreviewTemplate, PropostaPreviewState


@admin.register(PreviewTemplate)
class PreviewTemplateAdmin(admin.ModelAdmin):
	list_display = ["name", "is_active", "updated_at"]
	search_fields = ["name"]
	list_filter = ["is_active", "created_at", "updated_at"]


@admin.register(PropostaPreviewState)
class PropostaPreviewStateAdmin(admin.ModelAdmin):
	list_display = ["dimensionamento", "template", "updated_at"]
	search_fields = ["dimensionamento__id", "dimensionamento__cliente__nome"]
	list_filter = ["template", "created_at", "updated_at"]

