from rest_framework import serializers
from .models import blogPost

class blogPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = blogPost
        fields = ["id", "title", "content", "created_at"]