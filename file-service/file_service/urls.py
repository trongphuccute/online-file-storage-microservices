from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("files.urls")),
]

# Serve uploaded media files in local dev (DEBUG=True, no Azure)
if settings.DEBUG and not settings.AZURE_STORAGE_CONNECTION_STRING:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
