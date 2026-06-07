from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("health/", views.health),
    path("auth/register/", views.register),
    path("auth/login/", views.CustomTokenObtainPairView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("auth/logout/", views.logout),
    path("auth/profile/", views.profile),
    path("auth/change-password/", views.change_password),
]
