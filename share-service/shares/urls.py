from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health),
    path("shares/", views.my_share_links),
    path("shares/create/", views.create_share_link),
    path("shares/<uuid:token>/", views.share_link_detail, name="share_detail"),
    path("share/<uuid:token>/", views.public_share),
    path("public/<uuid:token>/", views.public_share),
]
