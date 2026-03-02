# Generated manually to add led field
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='serre',
            name='led',
            field=models.CharField(default='OFF', max_length=10),
        ),
    ]
