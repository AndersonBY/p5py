import uuid
from django.db import models
from django.contrib.auth.models import User


class CodeShareModel(models.Model):
    project_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_name = models.CharField(max_length=20, default="untitled")
    code = models.TextField(max_length=5000)
    language = models.CharField(max_length=20, default="python")
    create_time = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, default=None, null=True, blank=True)
    likes = models.IntegerField()
    views = models.IntegerField()

    def __str__(self):
        return str(self.project_id)

    class Meta:
        ordering = ["create_time"]
