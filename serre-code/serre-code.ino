#include <Wire.h>
#include "rgb_lcd.h"
#include <DHT.h>
#include <Servo.h>

/* ====== PINS ====== */
#define SOIL_SENSOR_PIN A1
#define LIGHT_SENSOR_PIN A2
#define DHT_PIN 3
#define SERVO_PIN 4
#define PUMP_RELAY_PIN 6
#define LIGHT_RELAY_PIN 2
#define BUTTON_PIN 8

/* ====== CAPTEURS ====== */
#define DHT_TYPE DHT22

/* ====== SEUILS ====== */
#define SOIL_DRY_THRESHOLD 140
#define TEMP_DAY_ON 22.0
#define TEMP_NIGHT_ON 18.0

#define PUMP_ON_TIME 20000UL
#define PUMP_LOCK_TIME 600000UL
#define SERIAL_INTERVAL 1000UL

/* ====== SERVO ====== */
#define SERVO_STEP 1
#define SERVO_INTERVAL 20

rgb_lcd lcd;
DHT dht(DHT_PIN, DHT_TYPE);
Servo servo;

/* ====== VARIABLES ====== */
unsigned long now;
unsigned long lastSerialTime = 0;
unsigned long lastDHTRead = 0;
unsigned long lastServoMove = 110;

float lastTemp = NAN;
float lastHum = NAN;

bool isDay = true;

/* ====== POMPE ====== */
bool pumpRunning = false;
bool pumpLocked = false;
unsigned long pumpStartTime = 0;
unsigned long pumpLockStartTime = 0;

/* ====== SERVO ETAT ====== */
bool servoAttached = false;
int servoTarget = 110;
int servoPosition = servoTarget;

/* ====== SERIAL ====== */
String cmd = "";

void setup() {
  Serial.begin(9600);

  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(LIGHT_RELAY_PIN, OUTPUT);
  pinMode(LIGHT_SENSOR_PIN, INPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  digitalWrite(PUMP_RELAY_PIN, LOW);
  digitalWrite(LIGHT_RELAY_PIN, LOW);

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
 int lightValue = analogRead(LIGHT_SENSOR_PIN);

  /* ====== DHT ====== */
  if (now - lastDHTRead >= 2000) {
    lastDHTRead = now;
    lastTemp = dht.readTemperature();
    lastHum  = dht.readHumidity();
  }

  float temp = lastTemp;
  float humAir = lastHum;


  lcd.setRGB(soilDry ? 255 : 0, soilDry ? 165 : 255, 0);

  /* ====== POMPE ====== */
  if (pumpLocked && now - pumpLockStartTime >= PUMP_LOCK_TIME)
    pumpLocked = false;

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

  /* ===== SERVO AUTO ===== */
  if (temp > 40) {
    servoTarget = 180;
    if (!servoAttached) {
      servo.attach(SERVO_PIN);
      servoAttached = true;
    }
  }

  if (temp < 15) {
    servoTarget = 110;
    if (!servoAttached) {
      servo.attach(SERVO_PIN);
      servoAttached = true;
    }
  }

  /* ====== MOUVEMENT SERVO PROGRESSIF ====== */
  if (servoAttached && now - lastServoMove >= SERVO_INTERVAL) {
    lastServoMove = now;

    if (servoPosition < servoTarget) {
      servoPosition += SERVO_STEP;
      servo.write(servoPosition);
    } else if (servoPosition > servoTarget) {
      servoPosition -= SERVO_STEP;
      servo.write(servoPosition);
    } else {
      servo.detach();
      servoAttached = false;
    }
  }


  if(isDay == true && lightValue<300){

    digitalWrite(LIGHT_RELAY_PIN, HIGH);
    
    }else if(lightValue>690){

       digitalWrite(LIGHT_RELAY_PIN, LOW);
    
    }

  lcd.setCursor(0, 1);
  lcd.print(soilValue);



  /* ====== ENVOI JSON ====== */
  if (now - lastSerialTime >= SERIAL_INTERVAL) {
    lastSerialTime = now;

    Serial.print("{");
    Serial.print("\"sol\":"); Serial.print(soilValue); Serial.print(",");
    Serial.print("\"temp\":"); Serial.print(temp); Serial.print(",");
    Serial.print("\"hum\":"); Serial.print(humAir); Serial.print(",");
    Serial.print("\"lumiere\":"); Serial.print(lightValue); Serial.print(",");
    Serial.print("\"periode\":\""); Serial.print(isDay ? "day" : "night"); Serial.print("\",");
    Serial.print("\"servo\":"); Serial.print(servoPosition); Serial.print(",");
    Serial.print("\"pompe\":\""); Serial.print(pumpRunning ? "ON" : "OFF"); Serial.print("\",");
    Serial.print("\"led\":\""); Serial.print(!isDay && lightValue == LOW ? "ON" : "OFF"); Serial.print("\"");
    Serial.println("}");
  }

  /* ====== RECEPTION COMMANDE ====== */
  while (Serial.available()) {
    char c = Serial.read();

    if (c == '\n') {
      cmd.trim();

      if (cmd == "toit_1") {
        servoTarget = 180;
        if (!servoAttached) {
          servo.attach(SERVO_PIN);
          servoAttached = true;
        }
      }
      else if (cmd == "toit_0") {
        servoTarget = 110;
        if (!servoAttached) {
          servo.attach(SERVO_PIN);
          servoAttached = true;
        }
      }
      else if (cmd.startsWith("TIME:")) {
        int hour = cmd.substring(5).toInt(); 
        hour++;
        if (hour < 7 || hour >= 20) {
          isDay = false;
        } else {
          isDay = true;
        }
      }

      cmd = "";
    } else {
      cmd += c;
    }
  }

  if (digitalRead(BUTTON_PIN) == HIGH) {
    servo.attach(SERVO_PIN);
    servo.write(110);
    delay(1000);
    servo.detach();
    digitalWrite(LIGHT_RELAY_PIN, HIGH);
    delay(1000);
    digitalWrite(LIGHT_RELAY_PIN, LOW);
  }
}
