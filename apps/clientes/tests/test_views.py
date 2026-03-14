"""
Testes para as views (API) do app clientes.
"""

import pytest
import responses
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.clientes.models import Cliente, Vendedor


@pytest.fixture
def api_client():
    """Fixture que fornece um cliente de API."""
    return APIClient()


@pytest.fixture
def vendedor():
    """Fixture que cria um vendedor."""
    return Vendedor.objects.create(
        nome="Vendedor Teste",
        cargo="Vendedor",
        telefone="68999738807",
        email="vendedor@teste.com",
    )


@pytest.mark.django_db
class TestVendedorAPI:
    """Testes para a API de Vendedores."""

    def test_listar_vendedores(self, api_client):
        """Testa a listagem de vendedores."""
        Vendedor.objects.create(
            nome="Vendedor 1",
            cargo="Cargo 1",
            telefone="68999738807",
            email="v1@teste.com",
        )
        Vendedor.objects.create(
            nome="Vendedor 2",
            cargo="Cargo 2",
            telefone="68999738808",
            email="v2@teste.com",
        )

        url = reverse("clientes:vendedor-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2
        assert len(response.data["results"]) == 2

    def test_criar_vendedor(self, api_client):
        """Testa a criação de um vendedor via API."""
        url = reverse("clientes:vendedor-list")
        data = {
            "nome": "Novo Vendedor",
            "cargo": "Gerente",
            "telefone": "68999738809",
            "email": "novo@teste.com",
        }

        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["nome"] == "Novo Vendedor"
        assert Vendedor.objects.count() == 1

    def test_detalhe_vendedor(self, api_client, vendedor):
        """Testa a recuperação de detalhes de um vendedor."""
        url = reverse("clientes:vendedor-detail", args=[vendedor.id])
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == vendedor.id
        assert response.data["nome"] == vendedor.nome

    def test_atualizar_vendedor(self, api_client, vendedor):
        """Testa a atualização completa de um vendedor."""
        url = reverse("clientes:vendedor-detail", args=[vendedor.id])
        data = {
            "nome": "Nome Atualizado",
            "cargo": "Cargo Atualizado",
            "telefone": "68999999999",
            "email": vendedor.email,
        }

        response = api_client.put(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["nome"] == "Nome Atualizado"

        vendedor.refresh_from_db()
        assert vendedor.nome == "Nome Atualizado"

    def test_atualizar_parcial_vendedor(self, api_client, vendedor):
        """Testa a atualização parcial de um vendedor."""
        url = reverse("clientes:vendedor-detail", args=[vendedor.id])
        data = {"cargo": "Novo Cargo"}

        response = api_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["cargo"] == "Novo Cargo"

        vendedor.refresh_from_db()
        assert vendedor.cargo == "Novo Cargo"

    def test_deletar_vendedor_sem_clientes(self, api_client, vendedor):
        """Testa a exclusão de um vendedor sem clientes associados."""
        url = reverse("clientes:vendedor-detail", args=[vendedor.id])
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Vendedor.objects.count() == 0

    def test_listar_vendedores_ativos(self, api_client):
        """Testa o endpoint customizado de vendedores ativos."""
        Vendedor.objects.create(
            nome="Ativo 1",
            cargo="Cargo",
            telefone="68999738807",
            email="ativo1@teste.com",
            ativo=True,
        )
        Vendedor.objects.create(
            nome="Inativo",
            cargo="Cargo",
            telefone="68999738808",
            email="inativo@teste.com",
            ativo=False,
        )

        url = reverse("clientes:vendedor-ativos")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["nome"] == "Ativo 1"

    def test_filtrar_vendedores_por_ativo(self, api_client):
        """Testa filtro de vendedores por query param ativo."""
        Vendedor.objects.create(
            nome="Ativo",
            cargo="Cargo",
            telefone="68999738807",
            email="ativo@teste.com",
            ativo=True,
        )
        Vendedor.objects.create(
            nome="Inativo",
            cargo="Cargo",
            telefone="68999738808",
            email="inativo@teste.com",
            ativo=False,
        )

        url = reverse("clientes:vendedor-list")
        response = api_client.get(url, {"ativo": "false"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["nome"] == "Inativo"

    def test_buscar_vendedor_por_nome(self, api_client):
        """Testa busca de vendedor por nome."""
        Vendedor.objects.create(
            nome="João Silva",
            cargo="Cargo",
            telefone="68999738807",
            email="joao@teste.com",
        )
        Vendedor.objects.create(
            nome="Maria Santos",
            cargo="Cargo",
            telefone="68999738808",
            email="maria@teste.com",
        )

        url = reverse("clientes:vendedor-list")
        response = api_client.get(url, {"search": "João"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["nome"] == "João Silva"


@pytest.mark.django_db
class TestClienteAPI:
    """Testes para a API de Clientes."""

    @responses.activate
    def test_criar_cliente(self, api_client, vendedor):
        """Testa a criação de um cliente via API (com busca automática de CEP)."""
        # Mock da API ViaCEP
        responses.add(
            responses.GET,
            "https://viacep.com.br/ws/69900000/json/",
            json={
                "cep": "69900-000",
                "logradouro": "Avenida Brasil",
                "bairro": "Centro",
                "localidade": "Rio Branco",
                "uf": "AC",
            },
            status=200,
        )

        url = reverse("clientes:cliente-list")
        data = {
            "nome": "Carlos Alberto",
            "cpf": "12345678901",
            "telefone": "68999738807",
            "email": "carlos@email.com",
            "cep": "69900000",
            "numero": "123",
            "consumo_kwh_mes": 450,
            "tipo_ligacao": "bifasico",
            "tipo_telhado": "ceramico",
            "vendedor": vendedor.id,
        }

        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["nome"] == "Carlos Alberto"
        assert response.data["rua"] == "Avenida Brasil"
        assert response.data["bairro"] == "Centro"
        assert response.data["cidade"] == "Rio Branco"
        assert response.data["estado"] == "AC"
        assert "vendedor_detalhes" in response.data
        assert Cliente.objects.count() == 1

    def test_listar_clientes(self, api_client, vendedor):
        """Testa a listagem de clientes."""
        Cliente.objects.create(
            nome="Cliente 1",
            cpf="11111111111",
            cep="69900000",
            rua="Rua 1",
            numero="1",
            bairro="Bairro",
            cidade="Cidade",
            estado="AC",
            consumo_kwh_mes=100,
            tipo_ligacao="monofasico",
            tipo_telhado="laje",
            vendedor=vendedor,
        )
        Cliente.objects.create(
            nome="Cliente 2",
            cpf="22222222222",
            cep="69900001",
            rua="Rua 2",
            numero="2",
            bairro="Bairro",
            cidade="Cidade",
            estado="AC",
            consumo_kwh_mes=200,
            tipo_ligacao="bifasico",
            tipo_telhado="ceramico",
            vendedor=vendedor,
        )

        url = reverse("clientes:cliente-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2
        assert len(response.data["results"]) == 2

    def test_detalhe_cliente(self, api_client, vendedor):
        """Testa a recuperação de detalhes de um cliente."""
        cliente = Cliente.objects.create(
            nome="Teste",
            cpf="12345678901",
            cep="69900000",
            rua="Rua",
            numero="1",
            bairro="Bairro",
            cidade="Cidade",
            estado="AC",
            consumo_kwh_mes=100,
            tipo_ligacao="monofasico",
            tipo_telhado="laje",
            vendedor=vendedor,
        )

        url = reverse("clientes:cliente-detail", args=[cliente.id])
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == cliente.id
        assert response.data["nome"] == cliente.nome
        assert "vendedor_detalhes" in response.data

    def test_filtrar_clientes_por_vendedor(self, api_client):
        """Testa filtro de clientes por vendedor."""
        vendedor1 = Vendedor.objects.create(
            nome="Vendedor 1",
            cargo="Cargo",
            telefone="68999738807",
            email="v1@teste.com",
        )
        vendedor2 = Vendedor.objects.create(
            nome="Vendedor 2",
            cargo="Cargo",
            telefone="68999738808",
            email="v2@teste.com",
        )

        Cliente.objects.create(
            nome="Cliente V1",
            cpf="11111111111",
            cep="69900000",
            rua="Rua",
            numero="1",
            bairro="Bairro",
            cidade="Cidade",
            estado="AC",
            consumo_kwh_mes=100,
            tipo_ligacao="monofasico",
            tipo_telhado="laje",
            vendedor=vendedor1,
        )
        Cliente.objects.create(
            nome="Cliente V2",
            cpf="22222222222",
            cep="69900001",
            rua="Rua",
            numero="2",
            bairro="Bairro",
            cidade="Cidade",
            estado="AC",
            consumo_kwh_mes=200,
            tipo_ligacao="bifasico",
            tipo_telhado="ceramico",
            vendedor=vendedor2,
        )

        url = reverse("clientes:cliente-list")
        response = api_client.get(url, {"vendedor": vendedor1.id})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["nome"] == "Cliente V1"

    def test_deletar_cliente(self, api_client, vendedor):
        """Testa a exclusão de um cliente."""
        cliente = Cliente.objects.create(
            nome="Teste",
            cpf="12345678901",
            cep="69900000",
            rua="Rua",
            numero="1",
            bairro="Bairro",
            cidade="Cidade",
            estado="AC",
            consumo_kwh_mes=100,
            tipo_ligacao="monofasico",
            tipo_telhado="laje",
            vendedor=vendedor,
        )

        url = reverse("clientes:cliente-detail", args=[cliente.id])
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Cliente.objects.count() == 0
