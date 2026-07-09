from django.urls import path

from .views import CalculoFinanceiroAPIView

app_name = "financeiro"

urlpatterns = [
    path("calcular/", CalculoFinanceiroAPIView.as_view(), name="calcular"),
]
