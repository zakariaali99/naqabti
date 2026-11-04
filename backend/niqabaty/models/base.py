from django.db import models
from django.conf import settings
from simple_history.models import HistoricalRecords

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def get_by_natural_key(self, *args):
        """Support natural key retrieval while honoring soft delete.

        Usage patterns supported:
        1. Django auth User model (or any model with USERNAME_FIELD) -> single arg.
        2. Any model that defines an iterable attribute `natural_key_fields` specifying
           the field names making up the natural key. Number of args must match.

        To enable multi-field natural keys on a model inheriting BaseModel, define for example:

            natural_key_fields = ("code", "version")
            def natural_key(self):
                return (self.code, self.version)

        If neither USERNAME_FIELD nor natural_key_fields are defined, NotImplementedError is raised.
        """
        # Case 1: Auth style (single username/email field)
        if hasattr(self.model, 'USERNAME_FIELD') and len(args) == 1:
            field = self.model.USERNAME_FIELD
            return self.get(**{field: args[0]})

        # Case 2: Explicit multi-field declaration on model
        natural_fields = getattr(self.model, 'natural_key_fields', None)
        if natural_fields:
            if len(args) != len(natural_fields):
                raise ValueError(
                    f"Natural key for {self.model.__name__} expects {len(natural_fields)} values, got {len(args)}"
                )
            lookup = dict(zip(natural_fields, args))
            return self.get(**lookup)

        raise NotImplementedError(
            f"Model {self.model.__name__} does not define USERNAME_FIELD or natural_key_fields; "
            "cannot resolve natural key."
        )

class BaseModel(models.Model):
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_%(class)s_set"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_%(class)s_set"
    )
    is_deleted = models.BooleanField(default=False)

    # Enable django-simple-history on all subclasses; required when used on abstract base classes
    history = HistoricalRecords(inherit=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()  # includes deleted

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.save()
