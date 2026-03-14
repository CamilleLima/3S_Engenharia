# TODO: implementar a lógica de negócio financeira aqui
# As views devem APENAS chamar funções deste arquivo; não coloque regras de negócio nas views
from decimal import Decimal, ROUND_HALF_UP



# TODO: definir a função principal de cálculo financeiro
# Exemplo de estrutura:
#
def calcular_payback(dados: dict) -> dict:
    """
    Recebe os dados de entrada e retorna o resultado do cálculo financeiro.
    Esta função implementa a lógica de cálculo de Retorno de Investimento (Payback).
 
    Args:
        dados (dict): Dicionário com os parâmetros necessários. Ex:
            {
                "custo_equipamentos": 12000.0,
                "custo_instalacao": 3000.0,
                "geracao_mensal_kwh": 400.0,
                "tarifa_energia_kwh": 0.95,
                "custo_disponibilidade_rs": 50.0  # Opcional, padrão 50.0
            }
 
    Returns:
        dict: Dicionário com os resultados calculados (payback, economia, etc.)
              ou um dicionário de erro.
 
    TODO: discutir fórmulas e parâmetros na reunião de equipe
    """
    # 1. Extrair dados e converter para Decimal para precisão financeira.
    # A conversão via string (ex: Decimal(str(valor))) evita imprecisões do float.
    custo_equipamentos = Decimal(str(dados.get("custo_equipamentos", "0.0")))
    custo_instalacao = Decimal(str(dados.get("custo_instalacao", "0.0")))
    geracao_mensal_kwh = Decimal(str(dados.get("geracao_mensal_kwh", "0.0")))
    tarifa_energia_kwh = Decimal(str(dados.get("tarifa_energia_kwh", "0.0")))
    custo_disponibilidade_rs = Decimal(str(dados.get("custo_disponibilidade_rs", "50.0")))
 
    # 2. Investimento Total
    investimento_total = custo_equipamentos + custo_instalacao
 
    # 3. Economia Bruta Mensal (o que o cliente deixaria de pagar)
    economia_bruta_mensal = geracao_mensal_kwh * tarifa_energia_kwh
 
    # 4. Economia Líquida Mensal (descontando a taxa mínima)
    economia_liquida_mensal = economia_bruta_mensal - custo_disponibilidade_rs
 
    # 5. Prevenção de divisão por zero ou economia negativa
    if economia_liquida_mensal <= Decimal("0"):
        return {
            "erro": "O sistema dimensionado não gera economia suficiente para cobrir a taxa mínima."
        }
 
    # 6. Cálculo do Payback (em meses e convertido para anos)
    payback_meses = investimento_total / economia_liquida_mensal
    payback_anos = payback_meses / Decimal("12")
 
    # 7. Economia Acumulada (Exemplo para 25 anos de vida útil do painel)
    vida_util_anos = Decimal("25")
    economia_acumulada_25_anos = (economia_liquida_mensal * Decimal("12")) * vida_util_anos
 
    # 8. Arredondar resultados para o número correto de casas decimais
    # Retornamos como float para ser facilmente serializável em JSON pela API.
    TWO_PLACES = Decimal("0.01")
    ONE_PLACE = Decimal("0.1")
 
    return {
        "investimento_total_rs": float(investimento_total.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)),
        "economia_mensal_rs": float(economia_liquida_mensal.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)),
        "economia_anual_rs": float((economia_liquida_mensal * 12).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)),
        "payback_meses": float(payback_meses.quantize(ONE_PLACE, rounding=ROUND_HALF_UP)),
        "payback_anos": float(payback_anos.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)),
        "economia_25_anos_rs": float(economia_acumulada_25_anos.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)),
    }
