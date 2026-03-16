from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dimensionamento", "0003_dimensionamento_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="dimensionamento",
            name="latitude_cliente",
            field=models.DecimalField(
                blank=True,
                decimal_places=6,
                max_digits=10,
                null=True,
                validators=[
                    MinValueValidator(Decimal("-90")),
                    MaxValueValidator(Decimal("90")),
                ],
                verbose_name="Latitude do Cliente",
            ),
        ),
        migrations.AddField(
            model_name="dimensionamento",
            name="longitude_cliente",
            field=models.DecimalField(
                blank=True,
                decimal_places=6,
                max_digits=10,
                null=True,
                validators=[
                    MinValueValidator(Decimal("-180")),
                    MaxValueValidator(Decimal("180")),
                ],
                verbose_name="Longitude do Cliente",
            ),
        ),
    ]
