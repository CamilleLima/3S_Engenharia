"""
URLs para o app clientes.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ClienteViewSet, VendedorViewSet

app_name = "clientes"

# Router DRF para gerar automaticamente as URLs dos ViewSets
router = DefaultRouter()
router.register(r"vendedores", VendedorViewSet, basename="vendedor")
router.register(r"", ClienteViewSet, basename="cliente")

urlpatterns = [
    path("", include(router.urls)),
]
