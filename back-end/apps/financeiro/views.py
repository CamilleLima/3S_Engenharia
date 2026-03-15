from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response

from .serializers import (
    CalculoFinanceiroCalcularSerializer,
    CalculoFinanceiroSerializer,
)


class CalculoFinanceiroAPIView(CreateAPIView):
    """Executa cálculo financeiro (RF3) e persiste resultado."""

    serializer_class = CalculoFinanceiroCalcularSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        output = CalculoFinanceiroSerializer(instance)
        return Response(output.data, status=status.HTTP_201_CREATED)
