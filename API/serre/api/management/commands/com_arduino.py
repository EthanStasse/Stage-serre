import serial
import json
import time

from django.core.management.base import BaseCommand
from api.models import Serre


class Command(BaseCommand):
    help = 'Lit les données Arduino via USB'

    def handle(self, *args, **kwargs):
        ser = serial.Serial('/dev/ttyACM0', 9600, timeout=1)

        self.stdout.write("========================================")
        self.stdout.write("En écoute sur /dev/ttyACM0...")
        self.stdout.write("========================================")

        MODE_A_ENVOYER = "toit_1"   # <<< CHANGE ICI LA VALEUR (0 / 1 / 2)

        while True:
            try:
                # -------- LECTURE DONNÉES --------
                line = ser.readline().decode('utf-8').strip()
                if line:
                    print(f"[SERIAL] {line}")

                    if line.startswith('{'):
                        try:
                            data = json.loads(line)
                            Serre.objects.create(
                                sol=data['sol'],
                                temp=data['temp'],
                                hum=data['hum'],
                                lumière=data['lumiere'],
                                periode=data['periode'],
                                servo=data['servo'],
                                pompe=data['pompe'],
                                led=data.get('led', 'OFF')
                            )
                            self.stdout.write(f"Sauvegardé : {data}")

                            total_count = Serre.objects.count()
                            if total_count > 500:
                                to_delete = total_count - 500
                                oldest_ids = Serre.objects.order_by('created_at').values_list('id', flat=True)[:to_delete]
                                Serre.objects.filter(id__in=oldest_ids).delete()

                        except json.JSONDecodeError:
                            pass

                # -------- ENVOI SIMPLE D’UNE VALEUR --------
                ser.write((MODE_A_ENVOYER + '\n').encode('utf-8'))
                ser.flush()

                time.sleep(1)  # évite d'envoyer en boucle trop vite

            except Exception as e:
                self.stdout.write(f"Erreur: {e}")

            time.sleep(0.05)