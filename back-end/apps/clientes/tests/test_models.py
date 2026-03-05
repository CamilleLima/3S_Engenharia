# TODO: escrever testes para os modelos do app clientes
# Cobrir: criação, validação de campos, relacionamentos, métodos __str__
#
# Exemplo de estrutura:
#
# @pytest.mark.django_db
# class TestExampleModel:
#     def test_create(self):
#         # TODO: implementar
#         pass
#
#     def test_str(self):
#         # TODO: implementar
#         pass


# TODO: importar modelos após defini-los
# from apps.clientes.models import ...
import pytest


@pytest.mark.django_db
def test_placeholder():
    """Placeholder — remover e substituir por testes reais."""
    assert True
 — app clientes (RF1)
Execute com: pytest apps/clientes/tests/
"""
import pytest


@pytest.mark.django_db
class TestClienteModel:
    """Testes do modelo Cliente. A ser implementado na etapa de RF1."""

    def test_placeholder(self):
        """Placeholder: confirma que a suite de testes está configurada."""
        assert True
