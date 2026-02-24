import serial
import json
from django.core.management.base import BaseCommand
from api.models import Serre

class Command(BaseCommand):
    help = 'Lit les données Arduino via USB'

    def handle(self, *args, **kwargs):
        # Sur Raspberry Pi le port est /dev/ttyUSB0 ou /dev/ttyACM0
        ser = serial.Serial('/dev/ttyACM0', 9600, timeout=1)
        self.stdout.write("En écoute sur /dev/ttyACM0...")

        while True:
            try:
                line = ser.readline().decode('utf-8').strip()
                if line.startswith('{'):
                    data = json.loads(line)
                    Serre.objects.create(
                        sol=data['sol'],
                        temp=data['temp'],
                        hum=data['hum'],
                        lumière=data['lumiere'],
                        periode=data['periode'],
                        servo=data['servo'],
                        pompe=data['pompe']
                    )
                    self.stdout.write(f"Sauvegardé : {data}")
                    
                    # Vérifier si on dépasse 1000 enregistrements
                    total_count = Serre.objects.count()
                    if total_count > 1000:
                        # Supprimer les plus anciens enregistrements
                        to_delete = total_count - 1000
                        oldest_records = Serre.objects.order_by('created_at')[:to_delete]
                        oldest_records.delete()
                        self.stdout.write(self.style.WARNING(f"Nettoyage : {to_delete} anciens enregistrements supprimés. Total : 1000"))
            except Exception as e:
                self.stdout.write(f"Erreur : {e}")