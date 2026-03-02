from django.db import models

# Create your models here.

class Serre(models.Model):
    sol = models.IntegerField()
    temp = models.FloatField()
    hum = models.FloatField()
    lumière = models.IntegerField()
    periode = models.CharField(max_length=10)
    servo = models.IntegerField()
    pompe = models.CharField(max_length=10)
    led = models.CharField(max_length=10, default='OFF')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Serre {self.id} - Sol: {self.sol}, Temp: {self.temp}, Hum: {self.hum}, Lumière: {self.lumière}, Période: {self.periode}, Servo: {self.servo}, Pompe: {self.pompe}, Led: {self.led}"
