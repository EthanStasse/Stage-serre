from django.db import models

class Serre(models.Model):
    sol = models.IntegerField()
    temp = models.FloatField()
    hum = models.FloatField()
    lumiere = models.IntegerField()
    periode = models.CharField(max_length=10)
    servo = models.IntegerField()
    pompe = models.CharField(max_length=10)
    led = models.CharField(max_length=10, default='OFF')
    created_at = models.DateTimeField(auto_now_add=True)