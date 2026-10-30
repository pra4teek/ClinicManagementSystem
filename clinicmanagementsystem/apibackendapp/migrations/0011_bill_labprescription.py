from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("apibackendapp", "0010_merge_prescription_and_notifications"),
    ]

    operations = [
        migrations.AddField(
            model_name="bill",
            name="LabPrescriptionId",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="bills",
                to="apibackendapp.labprescription",
            ),
        ),
    ]
