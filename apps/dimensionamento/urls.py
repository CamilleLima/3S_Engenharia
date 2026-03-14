from django.urls import path

from .views import (
    DimensionamentoCalcularAPIView,
    DimensionamentoGeoCalcularAPIView,
    OrcamentoEtapasCreateAPIView,
)

app_name = "dimensionamento"

urlpatterns = [
    path("calcular/", DimensionamentoCalcularAPIView.as_view(), name="calcular"),
    path(
        "calcular-geo/",
        DimensionamentoGeoCalcularAPIView.as_view(),
        name="calcular-geo",
    ),
    path(
        "orcamento/etapas/",
        OrcamentoEtapasCreateAPIView.as_view(),
        name="orcamento-etapas",
    ),
]
