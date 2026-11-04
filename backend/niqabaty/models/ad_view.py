from django.db import models
from django.conf import settings
from .ad import Ad


class AdView(models.Model):
    ad = models.ForeignKey(Ad, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ad_views')
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('ad', 'user')
        ordering = ['-viewed_at']

    def __str__(self):
        return f"{self.user.username} viewed {self.ad.title} at {self.viewed_at}"
