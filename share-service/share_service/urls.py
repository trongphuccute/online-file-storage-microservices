from django.contrib import admin
from django.urls import include, path

from shares import views as share_views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("shares.urls")),
    path("share/<uuid:token>/", share_views.public_share),
    path("public/<uuid:token>/", share_views.public_share),
]
