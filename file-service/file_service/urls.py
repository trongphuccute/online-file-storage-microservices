from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from files import views as file_views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("files.urls")),
    path("files/<path:blob_name>", file_views.public_file, name="public-file"),
    path("api/files/<int:file_id>/public/", file_views.public_file_meta, name="public-file-meta"),
]

# Always serve local media — Azure is disabled so the condition is always true,
# but keep AZURE_STORAGE_CONNECTION_STRING check for future re-enablement
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
