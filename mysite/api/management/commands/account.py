from django.core.management.base import BaseCommand
from api.models import Usr
from api.serializers import UsrSerializer



class Command(BaseCommand):
    help = "Manage Usr records (list/create)"

    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            choices=['list', 'create'],
            help='action to perform on Usr model',
        )
        parser.add_argument('--username', '-u', help='username for create')
        parser.add_argument('--password', '-p', help='password for create')

    def handle(self, *args, **options):
        action = options['action']

        if action == 'list':
            users = Usr.objects.all()
            if not users.exists():
                self.stdout.write(self.style.WARNING('No users found'))
                return
            for user in users:
                self.stdout.write(f"ID: {user.id}")
                self.stdout.write(f"  Username: {user.username}")
                self.stdout.write(f"  Password hash: {user.password}")
                self.stdout.write("")
        elif action == 'create':
            username = options.get('username')
            password = options.get('password')
            if not username or not password:
                self.stdout.write(self.style.ERROR('username and password required'))
                return
            serializer = UsrSerializer(data={'username': username, 'password': password})
            if serializer.is_valid():
                usr = serializer.save()
                self.stdout.write(self.style.SUCCESS(f"created user {usr.username} (id {usr.id})"))
            else:
                self.stdout.write(self.style.ERROR(str(serializer.errors)))
