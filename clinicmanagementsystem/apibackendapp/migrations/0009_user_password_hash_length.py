from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("apibackendapp", "0008_pharmacybillitem_prescriptionitem"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="Password",
            field=models.CharField(max_length=128),
        ),
    ]
