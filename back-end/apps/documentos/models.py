from django.db import models

from .defaults import get_default_preview_template_data


class PreviewTemplate(models.Model):
	"""Template de valores padrão para inicializar o preview da proposta."""

	name = models.CharField(max_length=120, unique=True, verbose_name="Nome")
	is_active = models.BooleanField(default=True, verbose_name="Ativo")
	data = models.JSONField(
		default=get_default_preview_template_data,
		verbose_name="Dados do template",
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		verbose_name = "Template de Preview"
		verbose_name_plural = "Templates de Preview"
		ordering = ["-updated_at"]
		db_table = "documentos_preview_templates"

	def __str__(self):
		status = "ativo" if self.is_active else "inativo"
		return f"{self.name} ({status})"


class PropostaPreviewState(models.Model):
	"""Estado editável persistido do preview para cada dimensionamento."""

	dimensionamento = models.OneToOneField(
		"dimensionamento.Dimensionamento",
		on_delete=models.CASCADE,
		related_name="preview_state",
		verbose_name="Dimensionamento",
	)
	template = models.ForeignKey(
		PreviewTemplate,
		on_delete=models.SET_NULL,
		related_name="proposal_states",
		null=True,
		blank=True,
		verbose_name="Template",
	)
	data = models.JSONField(default=dict, verbose_name="Estado do preview")
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		verbose_name = "Estado do Preview da Proposta"
		verbose_name_plural = "Estados do Preview da Proposta"
		ordering = ["-updated_at"]
		db_table = "documentos_preview_states"

	def __str__(self):
		return f"Preview da proposta #{self.dimensionamento_id}"


