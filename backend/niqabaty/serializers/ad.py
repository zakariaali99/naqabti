from rest_framework import serializers
from niqabaty.models import Ad, AdView
from .user import UserSerializer
from .branch import BranchSerializer
from .city import CitySerializer
from .doctor_specialty import DoctorSpecialtySerializer


class AdSerializer(serializers.ModelSerializer):
    advertiser_detail = UserSerializer(source='advertiser', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    target_branches_detail = BranchSerializer(source='target_branches', many=True, read_only=True)
    target_cities_detail = CitySerializer(source='target_cities', many=True, read_only=True)
    target_specialties_detail = DoctorSpecialtySerializer(source='target_specialties', many=True, read_only=True)

    class Meta:
        model = Ad
        fields = [
            'id', 'advertiser', 'advertiser_detail', 'title', 'content', 'featured_image',
            'target_branches', 'target_branches_detail',
            'target_cities', 'target_cities_detail',
            'target_specialties', 'target_specialties_detail',
            'expected_audience_count', 'status', 'status_display',
            'published_at', 'views_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['advertiser', 'expected_audience_count', 'published_at', 'views_count', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Default the advertiser to the current user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['advertiser'] = request.user
        return super().create(validated_data)
