# TODO: escrever testes unitários para as funções do services.py
# Cobrir: casos nominais, valores limite, entradas inválidas
#
# Exemplo de estrutura:
#
# class TestCalcularPayback:
#     def test_caso_nominal(self):
#         # TODO: implementar
#         pass
#
#     def test_valor_zero(self):
#         # TODO: implementar
#         pass


# TODO: importar services após defini-los
# from apps.financeiro.services import ...
import pytest


@pytest.mark.django_db
def test_placeholder():
    """Placeholder — remover e substituir por testes reais."""
    assert True
 (RF3)
Execute com: pytest apps/financeiro/tests/
"""
import pytest


@pytest.mark.django_db
class TestCalculoFinanceiro:
    """Testes do cálculo de payback/ROI. A ser implementado na etapa de RF3."""

    def test_placeholder(self):
        """Placeholder: confirma que a suite de testes está configurada."""
        assert True
