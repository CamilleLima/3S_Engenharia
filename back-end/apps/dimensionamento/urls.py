from django.urls import path

from .views import (
    DashboardAPIView,
    DimensionamentoCalcularAPIView,
    DimensionamentoGeoCalcularAPIView,
    OrcamentoEtapasCreateAPIView,
    PropostaDetalheAPIView,
    PropostaStatusUpdateAPIView,
)

app_name = "dimensionamento"

urlpatterns = [
    path("dashboard/", DashboardAPIView.as_view(), name="dashboard"),
    path("<int:pk>/detalhe/", PropostaDetalheAPIView.as_view(), name="detalhe"),
    path("<int:pk>/status/", PropostaStatusUpdateAPIView.as_view(), name="status"),
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
