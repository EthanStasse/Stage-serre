#include <Wire.h>
#include "rgb_lcd.h"
#include <DHT.h>
#include <Servo.h>

/* ====== PINS ====== */
#define SOIL_SENSOR_PIN A1
#define LIGHT_SENSOR_PIN 2
#define DHT_PIN 3
#define SERVO_PIN 4
#define PUMP_RELAY_PIN 6
#define LIGHT_RELAY_PIN A0
#define BUTTON_PIN 8

/* ====== CAPTEURS ====== */
#define DHT_TYPE DHT22

/* ====== SEUILS ====== */
#define SOIL_DRY_THRESHOLD 100

#define TEMP_MAX 30.0
#define TEMP_DAY_ON 22.0
#define TEMP_NIGHT_ON 18.0

#define PUMP_ON_TIME 1000UL
#define PUMP_LOCK_TIME 600000UL
#define SERIAL_INTERVAL 100UL

/* ====== SERVO LENT ====== */
#define SERVO_MIN_ANGLE 0
#define SERVO_MAX_ANGLE 180
#define SERVO_STEP 1
#define SERVO_UPDATE_INTERVAL 100UL

#define BUTTON_DEBOUNCE 200UL

/* ====== OBJETS ====== */
rgb_lcd lcd;
DHT dht(DHT_PIN, DHT_TYPE);
Servo servo;

/* ====== VARIABLES TEMPS ====== */
unsigned long now;
unsigned long lastSerialTime = 0;
unsigned long lastServoUpdate = 0;
unsigned long lastButtonTime = 0;

/* ====== DHT SECURISE ====== */
unsigned long lastDHTRead = 0;
float lastTemp = NAN;
float lastHum = NAN;

/* ====== ETAT JOUR / NUIT ====== */
bool isDay = true;

/* ====== POMPE ====== */
bool pumpRunning = false;
bool pumpLocked = false;
unsigned long pumpStartTime = 0;
unsigned long pumpLockStartTime = 0;

/* ====== SERVO ====== */
int servoPosition = SERVO_MIN_ANGLE;
int servoTarget = SERVO_MIN_ANGLE;

bool servoTestActive = false;
bool servoReturning = false;
int servoSavedPosition = SERVO_MIN_ANGLE;

/* ====== BOUTON ====== */
bool buttonLastState = HIGH;

void setup() {
  Serial.begin(9600);

  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(LIGHT_RELAY_PIN, OUTPUT);
  pinMode(LIGHT_SENSOR_PIN, INPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  digitalWrite(PUMP_RELAY_PIN, LOW);
  digitalWrite(LIGHT_RELAY_PIN, LOW);

  servo.attach(SERVO_PIN);
  servo.write(servoPosition);

  dht.begin();

  lcd.begin(16, 2);
  lcd.setRGB(0, 255, 0);
  lcd.setCursor(0, 0);
  lcd.print("Humidite sol");
}

void loop() {
  now = millis();

  /* ====== SOL ====== */
  int soilValue = analogRead(SOIL_SENSOR_PIN);
  bool soilDry = soilValue < SOIL_DRY_THRESHOLD;

  /* ====== LUMIERE ====== */
  int lightValue = digitalRead(LIGHT_SENSOR_PIN);

  /* ====== DHT ====== */
  if (now - lastDHTRead >= 2000) {
    lastDHTRead = now;
    lastTemp = dht.readTemperature();
    lastHum  = dht.readHumidity();
  }

  float temp = lastTemp;
  float humAir = lastHum;

  /* ====== JOUR / NUIT ====== */
  if (isDay) {
    if (!isnan(temp) && temp < TEMP_NIGHT_ON && lightValue == LOW) {
      isDay = false;
    }
  } else {
    if (!isnan(temp) && (temp > TEMP_DAY_ON || lightValue == HIGH)) {
      isDay = true;
    }
  }

  /* ====== RELAIS LUMIERE ====== */
  digitalWrite(LIGHT_RELAY_PIN, (!isDay && lightValue == LOW) ? HIGH : LOW);

  /* ====== LCD ====== */
  lcd.setCursor(0, 1);
  lcd.print("Valeur: ");
  lcd.print(soilValue);
  lcd.print("    ");

  lcd.setRGB(soilDry ? 255 : 0, soilDry ? 165 : 255, 0);

  /* ====== BOUTON ====== */
  bool buttonState = digitalRead(BUTTON_PIN);

  if (buttonLastState == HIGH && buttonState == LOW &&
      now - lastButtonTime > BUTTON_DEBOUNCE) {
    lastButtonTime = now;
    servoTestActive = true;
    servoReturning = false;
    servoSavedPosition = servoPosition;
    servoTarget = (servoPosition <= SERVO_MIN_ANGLE + 5)
                    ? SERVO_MAX_ANGLE
                    : SERVO_MIN_ANGLE;
  }

  buttonLastState = buttonState;

  /* ====== SERVO AUTO ====== */
  if (!servoTestActive) {
    servoTarget = (!isnan(temp) && temp > TEMP_MAX)
                    ? SERVO_MAX_ANGLE
                    : SERVO_MIN_ANGLE;
  }

  /* ====== SERVO LENT ====== */
if (now - lastServoUpdate >= SERVO_UPDATE_INTERVAL) {
    lastServoUpdate = now;

    if (servoPosition != servoTarget) {
        // Rattacher si nécessaire avant de bouger
        if (!servo.attached()) servo.attach(SERVO_PIN);

        if (servoPosition < servoTarget) servoPosition++;
        else if (servoPosition > servoTarget) servoPosition--;

        servo.write(servoPosition);

        // Gestion fin de test bouton
        if (servoTestActive && servoPosition == servoTarget) {
            if (!servoReturning) {
                servoReturning = true;
                servoTarget = servoSavedPosition;
            } else {
                servoTestActive = false;
                servoReturning = false;
            }
        }

    } else {
        // Position atteinte → on coupe le signal pour arrêter les vibrations
        if (servo.attached()) servo.detach();
    }
}

  /* ====== POMPE ====== */
  if (pumpLocked && now - pumpLockStartTime >= PUMP_LOCK_TIME) {
    pumpLocked = false;
  }

  if (!pumpLocked && !pumpRunning && soilDry) {
    pumpRunning = true;
    pumpStartTime = now;
    digitalWrite(PUMP_RELAY_PIN, HIGH);
  }

  if (pumpRunning && now - pumpStartTime >= PUMP_ON_TIME) {
    pumpRunning = false;
    pumpLocked = true;
    pumpLockStartTime = now;
    digitalWrite(PUMP_RELAY_PIN, LOW);
  }

  /* ====== SERIAL JSON → Raspberry Pi ====== */
  if (now - lastSerialTime >= SERIAL_INTERVAL) {
    lastSerialTime = now;

    Serial.print("{");
    Serial.print("\"sol\":");       Serial.print(soilValue);    Serial.print(",");
    Serial.print("\"temp\":");      Serial.print(temp);          Serial.print(",");
    Serial.print("\"hum\":");       Serial.print(humAir);        Serial.print(",");
    Serial.print("\"lumiere\":");   Serial.print(lightValue);    Serial.print(",");
    Serial.print("\"periode\":\""); Serial.print(isDay ? "JOUR" : "NUIT"); Serial.print("\",");
    Serial.print("\"servo\":");     Serial.print(servoPosition); Serial.print(",");
    Serial.print("\"pompe\":\"");   Serial.print(pumpRunning ? "ON" : pumpLocked ? "LOCK" : "OFF"); Serial.print("\"");
    Serial.println("}");
  }
}