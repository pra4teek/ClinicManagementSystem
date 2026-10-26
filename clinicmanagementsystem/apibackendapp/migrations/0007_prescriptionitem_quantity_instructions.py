from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("apibackendapp", "0006_alter_prescription_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="prescriptionitem",
            name="Instructions",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="prescriptionitem",
            name="Quantity",
            field=models.PositiveIntegerField(default=1),
        ),
    ]
