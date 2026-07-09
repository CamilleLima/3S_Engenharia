"""
Views para o app clientes.
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Cliente, Vendedor
from .serializers import (
    ClienteCreateSerializer,
    ClienteSerializer,
    VendedorSerializer,
)


class VendedorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operações CRUD de Vendedores.

    Endpoints:
    - GET /api/clientes/vendedores/ - Lista todos os vendedores
    - POST /api/clientes/vendedores/ - Cria um novo vendedor
    - GET /api/clientes/vendedores/{id}/ - Detalhe de um vendedor
    - PUT /api/clientes/vendedores/{id}/ - Atualiza um vendedor
    - PATCH /api/clientes/vendedores/{id}/ - Atualiza parcialmente
    - DELETE /api/clientes/vendedores/{id}/ - Remove um vendedor
    - GET /api/clientes/vendedores/ativos/ - Lista apenas vendedores ativos
    """

    queryset = Vendedor.objects.all()
    serializer_class = VendedorSerializer

    def get_queryset(self):
        """Permite filtrar vendedores por query params."""
        queryset = super().get_queryset()

        # Filtro por status ativo
        ativo = self.request.query_params.get("ativo", None)
        if ativo is not None:
            ativo_bool = ativo.lower() in ["true", "1", "sim", "yes"]
            queryset = queryset.filter(ativo=ativo_bool)

        # Busca por nome ou email
        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(nome__icontains=search) | queryset.filter(
                email__icontains=search
            )

        return queryset

    @action(detail=False, methods=["get"])
    def ativos(self, request):
        """Endpoint customizado para listar apenas vendedores ativos."""
        vendedores = self.queryset.filter(ativo=True)
        serializer = self.get_serializer(vendedores, many=True)
        return Response(serializer.data)


class ClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operações CRUD de Clientes.

    Endpoints:
    - GET /api/clientes/ - Lista todos os clientes
    - POST /api/clientes/ - Cria um novo cliente (busca CEP automaticamente)
    - GET /api/clientes/{id}/ - Detalhe de um cliente
    - PUT /api/clientes/{id}/ - Atualiza um cliente
    - PATCH /api/clientes/{id}/ - Atualiza parcialmente
    - DELETE /api/clientes/{id}/ - Remove um cliente
    - GET /api/clientes/por-vendedor/{vendedor_id}/ - Clientes de um vendedor
    """

    queryset = Cliente.objects.select_related("vendedor").all()
    serializer_class = ClienteSerializer

    def get_serializer_class(self):
        """Usa ClienteCreateSerializer para criação e detalhes."""
        if self.action in ["create", "retrieve"]:
            return ClienteCreateSerializer
        return ClienteSerializer

    def get_queryset(self):
        """Permite filtrar clientes por query params."""
        queryset = super().get_queryset()

        # Filtro por vendedor
        vendedor_id = self.request.query_params.get("vendedor", None)
        if vendedor_id:
            queryset = queryset.filter(vendedor_id=vendedor_id)

        # Filtro por estado
        estado = self.request.query_params.get("estado", None)
        if estado:
            queryset = queryset.filter(estado__iexact=estado)

        # Filtro por cidade
        cidade = self.request.query_params.get("cidade", None)
        if cidade:
            queryset = queryset.filter(cidade__icontains=cidade)

        # Busca por nome ou CPF
        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(nome__icontains=search) | queryset.filter(
                cpf__icontains=search
            )

        return queryset

    @action(
        detail=False,
        methods=["get"],
        url_path="por-vendedor/(?P<vendedor_id>[^/.]+)",
    )
    def por_vendedor(self, request, vendedor_id=None):
        """Endpoint customizado para listar clientes de um vendedor específico."""
        clientes = self.queryset.filter(vendedor_id=vendedor_id)
        serializer = self.get_serializer(clientes, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Sobrescreve delete para retornar mensagem customizada."""
        instance = self.get_object()
        cliente_nome = instance.nome
        self.perform_destroy(instance)
        return Response(
            {"detail": f"Cliente {cliente_nome} removido com sucesso."},
            status=status.HTTP_204_NO_CONTENT,
        )
