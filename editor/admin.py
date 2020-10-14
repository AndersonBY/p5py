from django.contrib import admin
from .models import CodeShareModel


class CodeShareModelAdmin(admin.ModelAdmin):
	list_display = (
		'project_id',
		'create_time',
	)


admin.site.register(CodeShareModel, CodeShareModelAdmin)
