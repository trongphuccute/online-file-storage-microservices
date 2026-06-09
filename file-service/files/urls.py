from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health),
    path("files/", views.list_files),
    path("files/upload/", views.upload_file),
    path("files/<int:file_id>/", views.file_detail),
    path("quota/", views.quota),
]
