# TODO: escrever testes unitários para as funções do services.py
# Cobrir: casos nominais, valores limite, entradas inválidas
#
# Exemplo de estrutura:
#
# class TestCalcularDimensionamento:
#     def test_caso_nominal(self):
#         # TODO: implementar
#         pass
#
#     def test_valor_zero(self):
#         # TODO: implementar
#         pass


# TODO: importar services após defini-los
# from apps.dimensionamento.services import ...
import pytest


@pytest.mark.django_db
def test_placeholder():
    """Placeholder — remover e substituir por testes reais."""
    assert True
 — app dimensionamento (RF2)
Execute com: pytest apps/dimensionamento/tests/
"""
import pytest


@pytest.mark.django_db
class TestDimensionamento:
    """Testes do motor de cálculo fotovoltaico. A ser implementado na etapa de RF2."""

    def test_placeholder(self):
        """Placeholder: confirma que a suite de testes está configurada."""
        assert True
