from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dimensionamento", "0002_alter_dimensionamento_fator_perda_decimal_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="dimensionamento",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pendente"),
                    ("accepted", "Aceita"),
                    ("rejected", "Recusada"),
                ],
                default="pending",
                max_length=20,
                verbose_name="Status da Proposta",
            ),
        ),
    ]
