import serial
import json
import time

from django.core.management.base import BaseCommand
from api.models import Serre


class Command(BaseCommand):
    help = 'Read Arduino data via USB and continuously toggle servo'

    def handle(self, *args, **kwargs):
        try:
            ser = serial.Serial('/dev/ttyACM0', 9600, timeout=1)
        except serial.SerialException:
            try:
                ser = serial.Serial('/dev/ttyACM1', 9600, timeout=1)
            except serial.SerialException:
                self.stdout.write(
                    "Erreur: Impossible d'ouvrir /dev/ttyACM0 ou /dev/ttyACM1"
                )
                return

        self.stdout.write("========================================")
        self.stdout.write("Listening on serial port...")
        self.stdout.write("========================================")

        while True:
            try:
                now = time.time()
                # ---------------- READ SERIAL ----------------
                line = ser.readline().decode('utf-8').strip()
                if line:
                    print(f"[SERIAL] {line}")

                # ---------------- TOGGLE SERVO ----------------
                ser.write(("toit_0\n").encode('utf-8'))
                ser.flush()
                print("[SERIAL] Command sent: toit_0")
                time.sleep(4)
                ser.write(("toit_1\n").encode('utf-8'))
                ser.flush()
                print("[SERIAL] Command sent: toit_1")
                time.sleep(4)

                time.sleep(0.05)  # small sleep to avoid busy-wait

            except Exception as e:
                self.stdout.write(f"Erreur: {e}")