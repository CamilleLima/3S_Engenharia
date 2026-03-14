from django.urls import include, path
from rest_framework.routers import DefaultRouter

# TODO: importar ViewSets após defini-los em views.py
# from .views import ...

router = DefaultRouter()

# TODO: registrar rotas no router após criar os ViewSets
# Exemplo:
# router.register(r"example", ExampleViewSet, basename="example")

urlpatterns = [
    path("", include(router.urls)),
]

