# -*- coding: utf-8 -*-
# @Author: Anderson
# @Date:   2019-04-25 00:30:09
# @Last Modified by:   ander
# @Last Modified time: 2019-12-07 01:14:16
from django.urls import path

from . import views

urlpatterns = [
    path("", views.editor, name="editor"),
    path("upload_code", views.upload_code, name="upload_code")
]
