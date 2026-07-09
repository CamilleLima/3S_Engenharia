"""
Testes para os modelos do app clientes.
"""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db.models import ProtectedError

from apps.clientes.models import Cliente, Vendedor


@pytest.mark.django_db
class TestVendedorModel:
    """Testes para o modelo Vendedor."""

    def test_criar_vendedor_com_dados_validos(self):
        """Testa a criação de um vendedor com todos os dados válidos."""
        vendedor = Vendedor.objects.create(
            nome="João Silva",
            cargo="Gerente de Vendas",
            telefone="68999738807",
            email="joao.silva@3sengenharia.com.br",
        )

        assert vendedor.id is not None
        assert vendedor.nome == "João Silva"
        assert vendedor.cargo == "Gerente de Vendas"
        assert vendedor.telefone == "68999738807"
        assert vendedor.email == "joao.silva@3sengenharia.com.br"
        assert vendedor.ativo is True
        assert vendedor.created_at is not None
        assert vendedor.updated_at is not None

    def test_str_vendedor(self):
        """Testa a representação em string do vendedor."""
        vendedor = Vendedor.objects.create(
            nome="Maria Santos",
            cargo="Consultora",
            telefone="68999738807",
            email="maria.santos@3sengenharia.com.br",
        )

        assert str(vendedor) == "Maria Santos - Consultora"

    def test_email_duplicado_deve_falhar(self):
        """Testa que não é possível criar dois vendedores com o mesmo email."""
        Vendedor.objects.create(
            nome="Vendedor 1",
            cargo="Cargo 1",
            telefone="68999738807",
            email="duplicado@teste.com",
        )

        with pytest.raises(IntegrityError):
            Vendedor.objects.create(
                nome="Vendedor 2",
                cargo="Cargo 2",
                telefone="68999738808",
                email="duplicado@teste.com",
            )

    def test_telefone_invalido_deve_falhar(self):
        """Testa validação de telefone com formato inválido."""
        vendedor = Vendedor(
            nome="Teste",
            cargo="Cargo",
            telefone="123",  # telefone inválido (menos de 10 dígitos)
            email="teste@teste.com",
        )

        with pytest.raises(ValidationError):
            vendedor.full_clean()

    def test_vendedor_inativo(self):
        """Testa a criação de vendedor inativo."""
        vendedor = Vendedor.objects.create(
            nome="Vendedor Inativo",
            cargo="Ex-vendedor",
            telefone="68999738807",
            email="inativo@teste.com",
            ativo=False,
        )

        assert vendedor.ativo is False

    def test_ordering_vendedores(self):
        """Testa que vendedores são ordenados por nome."""
        Vendedor.objects.create(
            nome="Zé",
            cargo="Cargo",
            telefone="68999738807",
            email="ze@teste.com",
        )
        Vendedor.objects.create(
            nome="Ana",
            cargo="Cargo",
            telefone="68999738808",
            email="ana@teste.com",
        )

        vendedores = Vendedor.objects.all()
        assert vendedores[0].nome == "Ana"
        assert vendedores[1].nome == "Zé"


@pytest.mark.django_db
class TestClienteModel:
    """Testes para o modelo Cliente."""

    @pytest.fixture
    def vendedor(self):
        """Fixture que cria um vendedor para ser usado nos testes."""
        return Vendedor.objects.create(
            nome="Vendedor Teste",
            cargo="Vendedor",
            telefone="68999738807",
            email="vendedor@teste.com",
        )

    def test_criar_cliente_com_dados_validos(self, vendedor):
        """Testa a criação de um cliente com todos os dados válidos."""
        cliente = Cliente.objects.create(
            nome="Carlos Alberto",
            cpf="12345678901",
            telefone="68999738807",
            email="carlos@email.com",
            cep="69900000",
            rua="Rua Teste",
            numero="123",
            bairro="Centro",
            cidade="Rio Branco",
            estado="AC",
            consumo_kwh_mes=450,
            tipo_ligacao="bifasico",
            tipo_telhado="ceramico",
            vendedor=vendedor,
        )

        assert cliente.id is not None
        assert cliente.nome == "Carlos Alberto"
        assert cliente.cpf == "12345678901"
        assert cliente.consumo_kwh_mes == 450
        assert cliente.vendedor == vendedor

    def test_str_cliente(self, vendedor):
        """Testa a representação em string do cliente."""
        cliente = Cliente.objects.create(
            nome="Ana Paula",
            cpf="98765432100",
            cep="69900000",
            rua="Rua Teste",
            numero="456",
            bairro="Centro",
            cidade="Rio Branco",
            estado="AC",
            consumo_kwh_mes=300,
            tipo_ligacao="monofasico",
            tipo_telhado="metalico",
            vendedor=vendedor,
        )

        assert str(cliente) == "Ana Paula - 98765432100"

    def test_cpf_duplicado_deve_falhar(self, vendedor):
        """Testa que não é possível criar dois clientes com o mesmo CPF."""
        Cliente.objects.create(
            nome="Cliente 1",
            cpf="11111111111",
            cep="69900000",
            rua="Rua Teste",
            numero="100",
            bairro="Centro",
            cidade="Rio Branco",
            estado="AC",
            consumo_kwh_mes=200,
            tipo_ligacao="monofasico",
            tipo_telhado="laje",
            vendedor=vendedor,
        )

        with pytest.raises(IntegrityError):
            Cliente.objects.create(
                nome="Cliente 2",
                cpf="11111111111",  # CPF duplicado
                cep="69900001",
                rua="Outra Rua",
                numero="200",
                bairro="Bairro",
                cidade="Rio Branco",
                estado="AC",
                consumo_kwh_mes=300,
                tipo_ligacao="bifasico",
                tipo_telhado="ceramico",
                vendedor=vendedor,
            )

    def test_cpf_invalido_deve_falhar(self, vendedor):
        """Testa validação de CPF com formato inválido."""
        cliente = Cliente(
            nome="Teste",
            cpf="123",  # CPF inválido (menos de 11 dígitos)
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

        with pytest.raises(ValidationError):
            cliente.full_clean()

    def test_cep_invalido_deve_falhar(self, vendedor):
        """Testa validação de CEP com formato inválido."""
        cliente = Cliente(
            nome="Teste",
            cpf="12345678901",
            cep="123",  # CEP inválido (menos de 8 dígitos)
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

        with pytest.raises(ValidationError):
            cliente.full_clean()

    def test_endereco_completo_property(self, vendedor):
        """Testa a property endereco_completo."""
        cliente = Cliente.objects.create(
            nome="João",
            cpf="12345678901",
            cep="69900000",
            rua="Av. Brasil",
            numero="500",
            bairro="Centro",
            cidade="Rio Branco",
            estado="AC",
            consumo_kwh_mes=350,
            tipo_ligacao="trifasico",
            tipo_telhado="fibrocimento",
            vendedor=vendedor,
        )

        assert cliente.endereco_completo == "Av. Brasil, 500 - Centro, Rio Branco/AC"

    def test_relacionamento_vendedor_protegido(self, vendedor):
        """Testa que não é possível deletar vendedor com clientes associados."""
        Cliente.objects.create(
            nome="Cliente Teste",
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

        # Tentativa de deletar vendedor deve falhar (PROTECT)
        with pytest.raises(ProtectedError):
            vendedor.delete()

    def test_cliente_campos_opcionais_vazios(self, vendedor):
        """Testa criação de cliente com campos opcionais vazios."""
        cliente = Cliente.objects.create(
            nome="Sem Contato",
            cpf="99999999999",
            telefone="",  # opcional
            email="",  # opcional
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

        assert cliente.telefone == ""
        assert cliente.email == ""

    def test_ordering_clientes(self, vendedor):
        """Testa que clientes são ordenados por data de criação (decrescente)."""
        cliente1 = Cliente.objects.create(
            nome="Cliente 1",
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
            vendedor=vendedor,
        )

        cliente2 = Cliente.objects.create(
            nome="Cliente 2",
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
            vendedor=vendedor,
        )

        clientes = Cliente.objects.all()
        # Mais recente primeiro
        assert clientes[0] == cliente2
        assert clientes[1] == cliente1
