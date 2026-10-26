from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("apibackendapp", "0007_prescriptionitem_quantity_instructions"),
    ]

    operations = [
        migrations.AddField(
            model_name="pharmacybillitem",
            name="PrescriptionItem",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="dispensed_lines",
                to="apibackendapp.prescriptionitem",
            ),
        ),
    ]
