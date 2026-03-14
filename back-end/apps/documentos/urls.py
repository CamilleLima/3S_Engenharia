"""
URLs para o app documentos.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import PropostaViewSet

app_name = "documentos"

router = DefaultRouter()
router.register(r"propostas", PropostaViewSet, basename="proposta")

urlpatterns = [path("", include(router.urls))]