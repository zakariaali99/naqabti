from rest_framework import serializers
from niqabaty.models.medical_report import MedicalReport
from niqabaty.serializers.user import UserSerializer


class MedicalReportSerializer(serializers.ModelSerializer):
    doctor_detail = UserSerializer(source='doctor', read_only=True)
    document_url = serializers.SerializerMethodField()
    pending_document_url = serializers.SerializerMethodField()
    approved_by_detail = UserSerializer(source='approved_by', read_only=True)

    # Write-only field: doctor uploads via this; gets routed to pending_document
    upload_document = serializers.FileField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = MedicalReport
        fields = [
            'id', 'doctor', 'doctor_detail',
            'patient_name', 'patient_id',
            'report_date', 'diagnosis', 'treatment', 'recommendations', 'notes',
            'document', 'document_url',
            'pending_document_url',
            'document_status',
            'approved_by', 'approved_by_detail', 'approved_at',
            'upload_document',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'doctor', 'doctor_detail',
            'report_date', 'document_url', 'document',
            'pending_document_url',
            'document_status', 'approved_by', 'approved_by_detail', 'approved_at',
            'created_at', 'updated_at',
        ]

    def get_document_url(self, obj):
        if obj.document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/medical-reports/{obj.id}/download/')
            return None
        return None

    def get_pending_document_url(self, obj):
        if obj.pending_document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/medical-reports/{obj.id}/download_pending/')
            return None
        return None

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['doctor'] = request.user

        upload = validated_data.pop('upload_document', None)
        if upload:
            validated_data['pending_document'] = upload
            validated_data['document_status'] = 'pending'

        return super().create(validated_data)

    def update(self, instance, validated_data):
        upload = validated_data.pop('upload_document', None)
        if upload:
            if instance.pending_document:
                instance.pending_document.delete(save=False)
            validated_data['pending_document'] = upload
            validated_data['document_status'] = 'pending'

        return super().update(instance, validated_data)
