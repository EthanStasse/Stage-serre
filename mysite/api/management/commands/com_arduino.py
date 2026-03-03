import serial
import time
import os
import json
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Serre  # Adjust if your app name is different

# ---------------- CONFIG ----------------
CMD_FILE = "/tmp/serre_cmds.txt"
SERIAL_PORTS = ["/dev/ttyUSB0", "/dev/ttyUSB1", "/dev/ttyACM0", "/dev/ttyACM1"]
BAUDRATE = 9600
MAX_RECORDS = 1000
SERIAL_INTERVAL = 0.1  # loop sleep time

# ---------------- COMMAND ----------------
class Command(BaseCommand):
    help = "Read Arduino data and send commands"

    def connect_serial(self):
        """Try all serial ports until Arduino is found"""
        while True:
            for port in SERIAL_PORTS:
                try:
                    self.stdout.write(f"[INFO] Trying port {port}...")
                    ser = serial.Serial(port, BAUDRATE, timeout=1)
                    time.sleep(2)  # allow Arduino to reset
                    self.stdout.write(self.style.SUCCESS(f"[SUCCESS] Connected to Arduino on {port}"))
                    return ser
                except serial.SerialException as e:
                    self.stdout.write(f"[DEBUG] Failed to connect to {port}: {e}")
                    continue
            self.stdout.write(self.style.WARNING("[WARNING] No Arduino found, retrying in 3 seconds..."))
            time.sleep(3)  # retry delay

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("[START] Arduino data bridge started"))
        ser = self.connect_serial()

        while True:
            # Current time for intervals
            now_time = time.time()

            # -------- READ SERIAL DATA --------
            try:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line and line.startswith("{"):
                    try:
                        data = json.loads(line)
                        with transaction.atomic():
                            Serre.objects.create(
                                sol=data.get('sol', 0),
                                temp=data.get('temp', 0.0),
                                hum=data.get('hum', 0.0),
                                lumière=data.get('lumiere', 0),
                                periode=data.get('periode', 'unknown'),
                                servo=data.get('servo', 0),
                                pompe=data.get('pompe', 'OFF'),
                                led=data.get('led', 'OFF'),
                                pompe_lock=data.get('pompe_lock', 600)
                            )
                            # ---------------- CLEANUP OLD RECORDS ----------------
                            total = Serre.objects.count()
                            if total > MAX_RECORDS:
                                oldest = Serre.objects.order_by('created_at')[:total - MAX_RECORDS]
                                Serre.objects.filter(id__in=oldest.values_list('id', flat=True)).delete()
                        self.stdout.write(f"[DATA] Saved: {data}")
                    except json.JSONDecodeError as e:
                        self.stdout.write(self.style.ERROR(f"[ERROR] Invalid JSON: {e}"))
            except serial.SerialException as e:
                # Arduino disconnected → reconnect
                self.stdout.write(self.style.ERROR(f"[ERROR] Arduino disconnected: {e}"))
                ser.close()
                ser = self.connect_serial()
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"[ERROR] Unexpected error: {e}"))

            # -------- SEND CURRENT TIME --------
            try:
                cmd_time = time.strftime("TIME:%H", time.localtime())  
                ser.write((cmd_time + "\n").encode("utf-8"))
                ser.flush()
            except Exception as e:
                self.stdout.write(f"[DEBUG] Error sending time: {e}")

            # -------- SEND COMMANDS FROM FILE --------
            try:
                if os.path.exists(CMD_FILE):
                    with open(CMD_FILE, "r") as f:
                        lines = f.readlines()
                    open(CMD_FILE, "w").close()  # clear file

                    for line in lines:
                        cmd = line.strip()
                        if cmd:
                            ser.write((cmd + "\n").encode("utf-8"))
                            ser.flush()
                            self.stdout.write(f"[CMD] Sent: {cmd}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"[ERROR] Error sending commands: {e}"))

            # -------- WAIT BEFORE NEXT LOOP --------
            time.sleep(SERIAL_INTERVAL)