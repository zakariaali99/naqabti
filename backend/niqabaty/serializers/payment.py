from rest_framework import serializers
from niqabaty.models import Payment, User, DoctorsMembership
from .user import UserSerializer


class PaymentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source='user', queryset=User.objects.all(), write_only=True)
    membership_id = serializers.PrimaryKeyRelatedField(source='membership', queryset=DoctorsMembership.objects.all(), write_only=True, required=False, allow_null=True)
    payment_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHOD_CHOICES)

    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    user_specialty = serializers.CharField(source='user.specialty', read_only=True)

    upload_document = serializers.FileField(write_only=True, required=False, allow_null=True)
    transaction_document_url = serializers.SerializerMethodField()
    invoice_file = serializers.FileField(required=False, allow_null=True)
    invoice_file_url = serializers.SerializerMethodField()

    reviewed_by_detail = UserSerializer(source='reviewed_by', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'user_id', 'user_full_name', 'user_phone', 'user_specialty',
            'membership', 'membership_id', 'amount', 'payment_method', 'payment_date',
            'reference_number', 'description',
            'upload_document', 'transaction_document_url',
            'invoice_file', 'invoice_file_url',
            'status', 'reviewed_by_detail', 'reviewed_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'payment_date', 'status', 'reviewed_at', 'created_at', 'updated_at']

    def get_transaction_document_url(self, obj):
        if not obj.transaction_document:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/payments/{obj.pk}/download_document/')
        return None

    def get_invoice_file_url(self, obj):
        if not obj.invoice_file:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.invoice_file.url)
        return obj.invoice_file.url

    def create(self, validated_data):
        upload_document = validated_data.pop('upload_document', None)
        instance = super().create(validated_data)
        if upload_document:
            instance.transaction_document = upload_document
            instance.save(update_fields=['transaction_document'])
        return instance

    def update(self, instance, validated_data):
        upload_document = validated_data.pop('upload_document', None)
        instance = super().update(instance, validated_data)
        if upload_document:
            if instance.transaction_document:
                instance.transaction_document.delete(save=False)
            instance.transaction_document = upload_document
            instance.save(update_fields=['transaction_document'])
        return instance
