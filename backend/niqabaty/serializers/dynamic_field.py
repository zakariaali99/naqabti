from rest_framework import serializers

from niqabaty.models.dynamic_field import BranchDynamicField, UserDynamicFieldValue


class BranchDynamicFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchDynamicField
        fields = [
            'id', 'branch', 'label_ar', 'label_en', 'placeholder_ar', 'placeholder_en',
            'field_type', 'options', 'is_required', 'order', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        field_type = attrs.get('field_type', getattr(self.instance, 'field_type', None))
        options = attrs.get('options', getattr(self.instance, 'options', None))

        if field_type == 'select' and not options:
            raise serializers.ValidationError({'options': 'Options are required for select fields.'})
        if field_type != 'select' and options:
            raise serializers.ValidationError({'options': 'Options are only allowed for select fields.'})

        return attrs


class UserDynamicFieldValueSerializer(serializers.ModelSerializer):
    field_id = serializers.PrimaryKeyRelatedField(source='field', read_only=True)
    field_label_ar = serializers.CharField(source='field.label_ar', read_only=True)
    field_label_en = serializers.CharField(source='field.label_en', read_only=True)
    field_type = serializers.CharField(source='field.field_type', read_only=True)

    class Meta:
        model = UserDynamicFieldValue
        fields = [
            'id', 'field_id', 'field_label_ar', 'field_label_en', 'field_type',
            'value_text', 'value_boolean', 'value_file',
        ]
        read_only_fields = fields
