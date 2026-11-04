from rest_framework import serializers
from niqabaty.models import (
    ProfessionalDevelopment,
    ProfessionalDevelopmentType,
    ProfessionalDevelopmentCategory,
    ProfessionalDevelopmentRegistration
)
from .user import UserSerializer
from .payment import PaymentSerializer

class ProfessionalDevelopmentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessionalDevelopmentType
        fields = '__all__'

class ProfessionalDevelopmentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessionalDevelopmentCategory
        fields = '__all__'

class ProfessionalDevelopmentSerializer(serializers.ModelSerializer):
    type_details = ProfessionalDevelopmentTypeSerializer(source='type', read_only=True)
    category_details = ProfessionalDevelopmentCategorySerializer(source='category', read_only=True)
    registration_status = serializers.SerializerMethodField()

    class Meta:
        model = ProfessionalDevelopment
        fields = '__all__'
        extra_fields = ['type_details', 'category_details', 'registration_status']

    def get_registration_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            registration = ProfessionalDevelopmentRegistration.objects.filter(
                doctor=request.user,
                professional_development=obj
            ).first()
            return registration.status if registration else None
        return None

class ProfessionalDevelopmentRegistrationSerializer(serializers.ModelSerializer):
    doctor_details = UserSerializer(source='doctor', read_only=True)
    professional_development_details = ProfessionalDevelopmentSerializer(source='professional_development', read_only=True)
    payment_records = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = ProfessionalDevelopmentRegistration
        fields = '__all__'
        read_only_fields = ['registration_date', 'paid_amount']
        extra_fields = ['doctor_details', 'professional_development_details', 'payment_records']
