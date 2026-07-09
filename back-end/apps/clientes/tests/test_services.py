"""
Testes para os serviços do app clientes.
"""

import pytest
import responses
from rest_framework.exceptions import ValidationError

from apps.clientes.services import buscar_endereco_por_cep


class TestBuscarEnderecoPorCep:
    """Testes para a função buscar_endereco_por_cep."""

    @responses.activate
    def test_buscar_cep_valido_com_sucesso(self):
        """Testa a busca de um CEP válido que retorna dados completos."""
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

        resultado = buscar_endereco_por_cep("69900000")

        assert resultado["rua"] == "Avenida Brasil"
        assert resultado["bairro"] == "Centro"
        assert resultado["cidade"] == "Rio Branco"
        assert resultado["estado"] == "AC"

    @responses.activate
    def test_buscar_cep_com_formatacao(self):
        """Testa que a função remove formatação do CEP (hífen)."""
        responses.add(
            responses.GET,
            "https://viacep.com.br/ws/69900000/json/",
            json={
                "cep": "69900-000",
                "logradouro": "Rua Teste",
                "bairro": "Bairro Teste",
                "localidade": "Cidade Teste",
                "uf": "AC",
            },
            status=200,
        )

        resultado = buscar_endereco_por_cep("69900-000")  # com hífen

        assert resultado["cidade"] == "Cidade Teste"

    @responses.activate
    def test_cep_nao_encontrado(self):
        """Testa o comportamento quando o CEP não existe."""
        responses.add(
            responses.GET,
            "https://viacep.com.br/ws/99999999/json/",
            json={"erro": True},
            status=200,
        )

        with pytest.raises(ValidationError) as excinfo:
            buscar_endereco_por_cep("99999999")

        assert "CEP não encontrado" in str(excinfo.value)

    def test_cep_formato_invalido_menos_digitos(self):
        """Testa validação de CEP com menos de 8 dígitos."""
        with pytest.raises(ValidationError) as excinfo:
            buscar_endereco_por_cep("123")

        assert "8 dígitos" in str(excinfo.value)

    def test_cep_formato_invalido_mais_digitos(self):
        """Testa validação de CEP com mais de 8 dígitos."""
        with pytest.raises(ValidationError) as excinfo:
            buscar_endereco_por_cep("123456789")

        assert "8 dígitos" in str(excinfo.value)

    def test_cep_com_caracteres_nao_numericos(self):
        """Testa validação de CEP com letras."""
        with pytest.raises(ValidationError) as excinfo:
            buscar_endereco_por_cep("ABCD1234")

        assert "8 dígitos" in str(excinfo.value)

    @responses.activate
    def test_erro_de_conexao(self):
        """Testa o comportamento quando há erro de conexão com a API."""
        import requests

        responses.add(
            responses.GET,
            "https://viacep.com.br/ws/69900000/json/",
            body=requests.exceptions.ConnectionError("Connection error"),
        )

        with pytest.raises(ValidationError) as excinfo:
            buscar_endereco_por_cep("69900000")

        assert "Erro ao consultar CEP" in str(excinfo.value)

    @responses.activate
    def test_cep_sem_logradouro(self):
        """Testa CEP que não possui logradouro (comum em áreas rurais)."""
        responses.add(
            responses.GET,
            "https://viacep.com.br/ws/69900999/json/",
            json={
                "cep": "69900-999",
                "logradouro": "",  # sem logradouro
                "bairro": "Zona Rural",
                "localidade": "Rio Branco",
                "uf": "AC",
            },
            status=200,
        )

        resultado = buscar_endereco_por_cep("69900999")

        assert resultado["rua"] == ""
        assert resultado["bairro"] == "Zona Rural"
        assert resultado["cidade"] == "Rio Branco"
        assert resultado["estado"] == "AC"

    @responses.activate
    def test_timeout_da_api(self):
        """Testa o comportamento quando a API demora demais para responder."""
        import requests

        responses.add(
            responses.GET,
            "https://viacep.com.br/ws/69900000/json/",
            body=requests.exceptions.Timeout("Request timeout"),
        )

        with pytest.raises(ValidationError) as excinfo:
            buscar_endereco_por_cep("69900000")

        assert "Erro ao consultar CEP" in str(excinfo.value)
