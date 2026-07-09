"""
Serviços auxiliares para o app clientes.
Mantém a lógica de negócio isolada das views.
"""

import requests
from rest_framework.exceptions import ValidationError


def buscar_endereco_por_cep(cep: str) -> dict:
    """
    Busca endereço via API ViaCEP.

    Args:
        cep: CEP com 8 dígitos numéricos (com ou sem formatação)

    Returns:
        dict: Dicionário com rua, bairro, cidade, estado

    Raises:
        ValidationError: Se o CEP for inválido ou não encontrado
    """
    # Remove formatação do CEP (hífen, pontos, espaços)
    cep_limpo = cep.replace("-", "").replace(".", "").replace(" ", "")

    # Valida formato básico
    if not cep_limpo.isdigit() or len(cep_limpo) != 8:
        raise ValidationError(
            {"cep": "CEP deve conter exatamente 8 dígitos numéricos."}
        )

    try:
        response = requests.get(
            f"https://viacep.com.br/ws/{cep_limpo}/json/", timeout=5
        )
        response.raise_for_status()
        data = response.json()

        # ViaCEP retorna {'erro': True} quando o CEP não existe
        if "erro" in data and data["erro"]:
            raise ValidationError({"cep": "CEP não encontrado."})

        # Retorna os dados normalizados
        return {
            "rua": data.get("logradouro", ""),
            "bairro": data.get("bairro", ""),
            "cidade": data.get("localidade", ""),
            "estado": data.get("uf", ""),
        }

    except requests.RequestException as e:
        raise ValidationError(
            {
                "cep": (
                    "Erro ao consultar CEP. Verifique sua conexão e "
                    f"tente novamente. Detalhes: {e!s}"
                )
            }
        ) from e
