from django.db import migrations
from django.contrib.auth.hashers import make_password

def seed_users(apps, schema_editor):
    Usr = apps.get_model('api', 'Usr')
    
    users = [
        {'username': 'admin', 'password': make_password('admin')},
    ]
    
    for user in users:
        Usr.objects.create(**user)

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0003_usr'),  
    ]

    operations = [
        migrations.RunPython(seed_users),
    ]