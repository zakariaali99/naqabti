from django.db import models
from django.core.exceptions import ValidationError

from .base import BaseModel


class BranchDynamicField(BaseModel):
    """A custom profile field defined by a branch manager for their own branch."""

    FIELD_TYPE_CHOICES = [
        ('text', 'Text'),
        ('boolean', 'Boolean'),
        ('select', 'Select'),
        ('file', 'File'),
    ]

    branch = models.ForeignKey(
        'niqabaty.Branch',
        on_delete=models.CASCADE,
        related_name='dynamic_fields',
    )
    label_ar = models.CharField(max_length=255)
    label_en = models.CharField(max_length=255, blank=True, null=True)
    placeholder_ar = models.CharField(max_length=255, blank=True, null=True)
    placeholder_en = models.CharField(max_length=255, blank=True, null=True)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES)
    # For field_type='select' only: [{"value": "...", "label_ar": "...", "label_en": "..."}]
    options = models.JSONField(blank=True, null=True)
    is_required = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'Branch Dynamic Field'
        verbose_name_plural = 'Branch Dynamic Fields'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.label_ar} ({self.branch.prefix})"

    def clean(self):
        super().clean()
        if self.field_type == 'select' and not self.options:
            raise ValidationError({'options': 'Options are required for select fields.'})


class UserDynamicFieldValue(BaseModel):
    """A member's submitted value for one of their branch's dynamic fields."""

    user = models.ForeignKey(
        'niqabaty.User',
        on_delete=models.CASCADE,
        related_name='dynamic_field_values',
    )
    field = models.ForeignKey(
        'niqabaty.BranchDynamicField',
        on_delete=models.CASCADE,
        related_name='values',
    )
    value_text = models.TextField(blank=True, null=True)
    value_boolean = models.BooleanField(blank=True, null=True)
    value_file = models.FileField(upload_to='dynamic_field_files/', blank=True, null=True)

    class Meta:
        unique_together = ('user', 'field')
        verbose_name = 'User Dynamic Field Value'
        verbose_name_plural = 'User Dynamic Field Values'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.user_id} / {self.field_id}"

    def clean(self):
        super().clean()
        if self.field.field_type == 'select' and self.value_text:
            valid_values = {opt.get('value') for opt in (self.field.options or [])}
            if self.value_text not in valid_values:
                raise ValidationError({'value_text': 'Value is not a valid option for this field.'})
