from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from .base import BaseModel


class Branch(BaseModel):

    name = models.CharField(max_length=255)
    prefix = models.CharField(max_length=64, unique=True)
    address = models.TextField(blank=True, null=True)
    # Use a simple string for city to avoid import cycles; can be changed to FK later
    city = models.CharField(max_length=128, blank=True, null=True)
    phone = models.CharField(max_length=32, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_branches'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Branch'
        verbose_name_plural = 'Branches'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.name} ({self.prefix})"

    def natural_key(self):
        return (self.prefix,)

    def clean(self):
        """Validate branch hierarchy depth (max 2 levels)."""
        super().clean()
        if self.parent:
            # Check if parent has a parent (would make this a 3rd level)
            if self.parent.parent:
                raise ValidationError({
                    'parent': 'Cannot create a sub-branch of a sub-branch. Maximum depth is 2 levels.'
                })
            
            # Prevent circular reference (parent cannot be self)
            if self.parent.id == self.id:
                raise ValidationError({
                    'parent': 'A branch cannot be its own parent.'
                })

    def save(self, *args, **kwargs):
        """Override save to call clean validation."""
        self.clean()
        super().save(*args, **kwargs)

    def get_all_children(self):
        """Get all child branches."""
        return self.children.all()

    def get_ancestors(self):
        """Get ancestor chain (parent, grandparent, etc.)."""
        ancestors = []
        current = self.parent
        while current:
            ancestors.append(current)
            current = current.parent
        return ancestors

    def is_parent(self):
        """Check if this branch has children."""
        return self.children.exists()

    def get_level(self):
        """Get the depth level (0 = root, 1 = child)."""
        return 1 if self.parent else 0