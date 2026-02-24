from rest_framework import serializers
from .models import Serre

class SerreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Serre
        fields = '__all__'