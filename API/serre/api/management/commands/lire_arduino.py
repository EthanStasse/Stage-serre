import serial
import json
import os
import time

from django.core.management.base import BaseCommand
from api.models import Serre

CMD_FILE = '/tmp/serre_cmds.txt'

class Command(BaseCommand):
    help = 'Lit les données Arduino via USB'

    def handle(self, *args, **kwargs):
        # Sur Raspberry Pi le port est /dev/ttyUSB0 ou /dev/ttyACM0
        ser = serial.Serial('/dev/ttyACM0', 9600, timeout=1)
        self.stdout.write("========================================")
        self.stdout.write("En écoute sur /dev/ttyACM0...")
        self.stdout.write(f"Fichier commandes: {CMD_FILE}")
        self.stdout.write("========================================")

        while True:
            try:
                # Read any incoming lines from Arduino
                line = ser.readline().decode('utf-8').strip()
                if line:
                    # Print everything (debug, ACK, and JSON)
                    print(f"[SERIAL] {line}")
                    
                    # Parse JSON lines separately
                    if line.startswith('{'):
                        try:
                            data = json.loads(line)
                            Serre.objects.create(
                                sol=data['sol'],
                                temp=data['temp'],
                                hum=data['hum'],
                                lumiere=data['lumiere'],
                                periode=data['periode'],
                                servo=data['servo'],
                                pompe=data['pompe'],
                                led=data.get('led', 'OFF')
                            )
                            self.stdout.write(f"Sauvegardé : {data}")
                            
                            # Vérifier si on dépasse 500 enregistrements
                            total_count = Serre.objects.count()
                            if total_count > 500:
                                to_delete = total_count - 500
                                oldest_ids = Serre.objects.order_by('created_at').values_list('id', flat=True)[:to_delete]
                                Serre.objects.filter(id__in=oldest_ids).delete()
                        except json.JSONDecodeError:
                            pass
            except Exception as e:
                self.stdout.write(f"Erreur lecture: {e}")

            # Check for queued commands to send to Arduino (file-based)
            try:
                if os.path.exists(CMD_FILE):
                    with open(CMD_FILE, 'r') as f:
                        lines = [l.strip() for l in f.readlines() if l.strip()]
                    
                    if lines:
                        self.stdout.write(f"[COMMANDES] Fichier trouvé: {len(lines)} commande(s)")
                        # Truncate file first (atomic-ish)
                        try:
                            open(CMD_FILE, 'w').close()
                        except Exception as e:
                            self.stdout.write(f"[COMMANDES] Erreur clearing file: {e}")
                        
                        # Send each command
                        for cmd in lines:
                            try:
                                self.stdout.write(f"[COMMANDES] Envoi: {cmd}")
                                ser.write((cmd + '\n').encode('utf-8'))
                                self.stdout.write(f"[COMMANDES] OK: {cmd}")
                                time.sleep(0.1)
                            except Exception as e:
                                self.stdout.write(f"[COMMANDES] Erreur envoi '{cmd}': {e}")
            except Exception as e:
                self.stdout.write(f"[COMMANDES] Erreur reading commands: {e}")

            time.sleep(0.05)