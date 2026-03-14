"""
Testes para os serializers do app clientes.
"""

import pytest
import responses
from rest_framework.exceptions import ValidationError

from apps.clientes.models import Vendedor
from apps.clientes.serializers import (
    ClienteSerializer,
    VendedorSerializer,
)


@pytest.mark.django_db
class TestVendedorSerializer:
    """Testes para o VendedorSerializer."""

    def test_serializar_vendedor(self):
        """Testa a serialização de um vendedor."""
        vendedor = Vendedor.objects.create(
            nome="João Silva",
            cargo="Gerente",
            telefone="68999738807",
            email="joao@teste.com",
        )

        serializer = VendedorSerializer(vendedor)
        data = serializer.data

        assert data["id"] == vendedor.id
        assert data["nome"] == "João Silva"
        assert data["cargo"] == "Gerente"
        assert data["telefone"] == "68999738807"
        assert data["email"] == "joao@teste.com"
        assert data["ativo"] is True
        assert "created_at" in data
        assert "updated_at" in data

    def test_criar_vendedor_via_serializer(self):
        """Testa a criação de um vendedor via serializer."""
        data = {
            "nome": "Maria Santos",
            "cargo": "Vendedora",
            "telefone": "68999738808",
            "email": "maria@teste.com",
        }

        serializer = VendedorSerializer(data=data)
        assert serializer.is_valid()

        vendedor = serializer.save()
        assert vendedor.nome == "Maria Santos"
        assert vendedor.ativo is True

    def test_validacao_telefone_com_letras(self):
        """Testa que o serializer rejeita telefone com letras."""
        data = {
            "nome": "Teste",
            "cargo": "Cargo",
            "telefone": "68999ABC808",  # telefone inválido
            "email": "teste@teste.com",
        }

        serializer = VendedorSerializer(data=data)
        assert not serializer.is_valid()
        assert "telefone" in serializer.errors

    def test_validacao_email_duplicado(self):
        """Testa que o serializer rejeita email duplicado."""
        Vendedor.objects.create(
            nome="Vendedor 1",
            cargo="Cargo",
            telefone="68999738807",
            email="duplicado@teste.com",
        )

        data = {
            "nome": "Vendedor 2",
            "cargo": "Cargo",
            "telefone": "68999738808",
            "email": "duplicado@teste.com",  # email duplicado
        }

        serializer = VendedorSerializer(data=data)
        assert not serializer.is_valid()
        assert "email" in serializer.errors


@pytest.mark.django_db
class TestClienteSerializer:
    """Testes para o ClienteSerializer."""

    @pytest.fixture
    def vendedor(self):
        """Fixture que cria um vendedor."""
        return Vendedor.objects.create(
            nome="Vendedor Teste",
            cargo="Vendedor",
            telefone="68999738807",
            email="vendedor@teste.com",
        )

    @responses.activate
    def test_criar_cliente_com_cep_valido(self, vendedor):
        """Testa a criação de cliente com CEP válido (busca automática)."""
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

        serializer = ClienteSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

        cliente = serializer.save()

        assert cliente.nome == "Carlos Alberto"
        assert cliente.rua == "Avenida Brasil"
        assert cliente.bairro == "Centro"
        assert cliente.cidade == "Rio Branco"
        assert cliente.estado == "AC"
        assert cliente.numero == "123"

    def test_validacao_cpf_com_letras(self, vendedor):
        """Testa que o serializer rejeita CPF com letras."""
        data = {
            "nome": "Teste",
            "cpf": "123ABC78901",  # CPF inválido
            "cep": "69900000",
            "numero": "1",
            "consumo_kwh_mes": 100,
            "tipo_ligacao": "monofasico",
            "tipo_telhado": "laje",
            "vendedor": vendedor.id,
        }

        serializer = ClienteSerializer(data=data)
        assert not serializer.is_valid()
        assert "cpf" in serializer.errors

    def test_validacao_cpf_tamanho_incorreto(self, vendedor):
        """Testa que o serializer rejeita CPF com tamanho incorreto."""
        data = {
            "nome": "Teste",
            "cpf": "123",  # CPF muito curto
            "cep": "69900000",
            "numero": "1",
            "consumo_kwh_mes": 100,
            "tipo_ligacao": "monofasico",
            "tipo_telhado": "laje",
            "vendedor": vendedor.id,
        }

        serializer = ClienteSerializer(data=data)
        assert not serializer.is_valid()
        assert "cpf" in serializer.errors

    def test_validacao_cep_invalido(self, vendedor):
        """Testa que o serializer rejeita CEP inválido."""
        data = {
            "nome": "Teste",
            "cpf": "12345678901",
            "cep": "123",  # CEP muito curto
            "numero": "1",
            "consumo_kwh_mes": 100,
            "tipo_ligacao": "monofasico",
            "tipo_telhado": "laje",
            "vendedor": vendedor.id,
        }

        serializer = ClienteSerializer(data=data)
        assert not serializer.is_valid()
        assert "cep" in serializer.errors

    @responses.activate
    def test_atualizar_cliente_com_novo_cep(self, vendedor):
        """Testa a atualização de cliente com novo CEP (busca automática)."""
        # Mock inicial
        responses.add(
            responses.GET,
            "https://viacep.com.br/ws/69900000/json/",
            json={
                "cep": "69900-000",
                "logradouro": "Rua Antiga",
                "bairro": "Bairro Antigo",
                "localidade": "Rio Branco",
                "uf": "AC",
            },
            status=200,
        )

        data_inicial = {
            "nome": "Teste",
            "cpf": "12345678901",
            "cep": "69900000",
            "numero": "1",
            "consumo_kwh_mes": 100,
            "tipo_ligacao": "monofasico",
            "tipo_telhado": "laje",
            "vendedor": vendedor.id,
        }

        serializer = ClienteSerializer(data=data_inicial)
        assert serializer.is_valid()
        cliente = serializer.save()

        # Mock para atualização com novo CEP
        responses.add(
            responses.GET,
            "https://viacep.com.br/ws/69901000/json/",
            json={
                "cep": "69901-000",
                "logradouro": "Rua Nova",
                "bairro": "Bairro Novo",
                "localidade": "Rio Branco",
                "uf": "AC",
            },
            status=200,
        )

        # Atualiza com novo CEP
        data_atualizacao = {"cep": "69901000"}
        serializer = ClienteSerializer(cliente, data=data_atualizacao, partial=True)
        assert serializer.is_valid()
        cliente_atualizado = serializer.save()

        assert cliente_atualizado.cep == "69901000"
        assert cliente_atualizado.rua == "Rua Nova"
        assert cliente_atualizado.bairro == "Bairro Novo"

    def test_campos_opcionais_vazios(self, vendedor):
        """Testa que telefone e email podem ser vazios."""
        data = {
            "nome": "Sem Contato",
            "cpf": "99999999999",
            "telefone": "",
            "email": "",
            "cep": "69900000",
            "rua": "Rua Teste",
            "bairro": "Bairro",
            "cidade": "Cidade",
            "estado": "AC",
            "numero": "1",
            "consumo_kwh_mes": 100,
            "tipo_ligacao": "monofasico",
            "tipo_telhado": "laje",
            "vendedor": vendedor.id,
        }

        serializer = ClienteSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
