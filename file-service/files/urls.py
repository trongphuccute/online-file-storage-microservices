from django.urls import path

from . import views

urlpatterns = [
    # health
    path("health/", views.health),
    path("admin/users/", views.admin_users),

    # photos
    path("files/", views.list_files),
    path("files/upload/", views.upload_file),
    path("files/<int:file_id>/", views.file_detail),          # GET detail / DELETE
    path("files/<int:file_id>/download/", views.download_file),
    path("files/<int:file_id>/thumbnail/", views.thumbnail_file),
    path("files/<int:file_id>/rename/", views.rename_file),
    path("files/<int:file_id>/move/", views.move_file),
    path("files/<int:file_id>/delete/", views.delete_file),   # DELETE explicit path

    # albums
    path("albums/", views.album_list),
    path("albums/<int:album_id>/", views.album_detail),

    # quota
    path("quota/", views.quota),
]
