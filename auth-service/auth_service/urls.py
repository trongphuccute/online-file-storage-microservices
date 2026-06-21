from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse   

#  thêm function này
def health(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),  #  dùng được rồi
    path("api/", include("users.urls")),
]
``
