from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health),
    path("shares/", views.my_share_links),
    path("shares/create/", views.create_share_link),
    path("public/<uuid:token>/", views.public_share),
]
