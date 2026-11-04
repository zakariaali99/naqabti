from rest_framework import serializers
from niqabaty.models import DoctorsMembership, Branch, DoctorsMembershipRenewHistory, MembershipType
from .user import UserSerializer, User
from .branch import BranchSerializer
from .membership_type import MembershipTypeSerializer

class DoctorsMembershipRenewHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorsMembershipRenewHistory
        fields = '__all__'

class DoctorsMembershipSerializer(serializers.ModelSerializer):
    doctor = serializers.SerializerMethodField()
    doctor_id = serializers.PrimaryKeyRelatedField(source='doctor', queryset=User.objects.all(), write_only=True)
    membership_type = MembershipTypeSerializer(read_only=True)
    membership_type_id = serializers.PrimaryKeyRelatedField(source='membership_type', queryset=MembershipType.objects.all(), write_only=True)
    branch = BranchSerializer(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(source='branch', queryset=Branch.objects.all(), write_only=True, required=False, allow_null=True)
    status = serializers.ChoiceField(choices=DoctorsMembership.STATUS_CHOICES)
    payment_status = serializers.ChoiceField(choices=DoctorsMembership.PAYMENT_STATUS_CHOICES, read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    payments = serializers.SerializerMethodField()
    has_renew_history = serializers.SerializerMethodField()
    renew_history = DoctorsMembershipRenewHistorySerializer(many=True, read_only=True)

    class Meta:
        model = DoctorsMembership
        fields = ['id', 'doctor', 'doctor_id', 'membership_type', 'membership_type_id', 'branch', 'branch_id', 'membership_number', 'start_date', 'end_date', 'status', 'is_active', 'subscription_count', 'total_amount', 'paid_amount', 'payment_status', 'remaining_amount', 'payments', 'created_at', 'updated_at', 'has_renew_history', 'renew_history']
        read_only_fields = ['id', 'membership_number', 'paid_amount', 'payment_status', 'created_at', 'updated_at', 'has_renew_history', 'renew_history']
    
    def get_doctor(self, obj):
        return UserSerializer(obj.doctor, context=self.context).data
    
    def get_payments(self, obj):
        from .payment import PaymentSerializer
        return PaymentSerializer(obj.payments.all(), many=True, context=self.context).data

    def get_has_renew_history(self, obj):
        return obj.renew_history.exists()

    def validate_end_date(self, value):
        if value == '':
            return None
        return value
