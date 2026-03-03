from rest_framework import serializers
from .models import Logs, Serre, Usr

class SerreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Serre
        fields = '__all__'

class UsrSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usr
        fields = '__all__'

class LogsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Logs
        fields = '__all__'