# TODO: implementar a lógica de negócio de dimensionamento aqui
# As views devem APENAS chamar funções deste arquivo; não coloque regras de negócio nas views


# TODO: definir a função principal de cálculo
# Exemplo de estrutura:
#
#def calcular_dimensionamento(dados: dict) -> dict:

    #Recebe os dados de entrada e retorna o resultado do dimensionamento.

    #Args:
        #dados: dicionário com os parâmetros necessários

    #Returns:
        #dicionário com os resultados calculados

    #TODO: discutir fórmulas e parâmetros na reunião de equipe

    #pass


def configuracao():
    configuracoes = {}

    #Precificação
    configuracoes["precificacao"] = {
        "preco_kit_por_watt": None,  
        "custo_instalacao": None,  
        "tarifa_energia": None  
    }

    #Parâmetros do sistema solar
    configuracoes["parametros_sistema_solar"] = {
        "potencia_painel": None, 
        "area_por_painel": None,  
        "eficiencia_sistema": None,  
        "irradiacao_solar": None 
    }

    #Responsável pela proposta
    configuracoes["dados_responsavel"] = {
        "nome_responsavel": None,  
        "contato_responsavel": None  
    }

    return configuracoes

def novo_orcamento():
    novo_orcamento = {}

    #Dados do cliente
    novo_orcamento['dados_do_cliente'] = {
        'nome_completo': None,  
        'estado': None,  
        'cidade': None,  
        'telefone_whatsapp': None 
    }

    #Dados técnicos
    novo_orcamento['dados_tecnicos'] = {
        'consumo_medio_mensal': None,  
        'tipo_de_ligacao': None,  
        'tipo_de_telhado': None 
    }

    #Dados do produto
    novo_orcamento['dados_do_produto'] = {
        'modelo_do_modulo': None, 
        'fabricante_do_modulo': None, 
        'potencia_do_modulo': None, 
        'peso_do_modulo': None,  
        'modelo_do_inversor_1': None,  
        'fabricante_do_inversor_1': None,  
        'potencia_do_inversor_1': None, 
        'garantia_do_inversor_1': None,  
        'modelo_do_inversor_2': None, 
        'fabricante_do_inversor_2': None, 
        'potencia_do_inversor_2': None, 
        'garantia_do_inversor_2': None 
    }

    return novo_orcamento

def dadosFinanceiros(valor_do_kit: float, custo_material_projeto: float, lucro: float, imposto_sobre_servico: float):
    """
    Calcula os dados financeiros do sistema.

    Args:
        valor_do_kit (float): Valor do kit.
        custo_material_projeto (float): Custo do material do projeto.
        lucro (float): Percentual de lucro.
        imposto_sobre_servico (float): Percentual de imposto sobre o serviço.

    Returns:
        dict: Dicionário contendo os valores calculados.
    """
    valor_do_lucro = valor_do_kit * (lucro / 100)
    valor_total_sistema = valor_do_kit + valor_do_lucro + custo_material_projeto
    lucro_liquido = valor_do_lucro - (valor_do_lucro * (imposto_sobre_servico / 100))

    # Retorna os dados financeiros calculados
    return {
        "valor_do_kit": valor_do_kit,
        "custo_material_projeto": custo_material_projeto,
        "lucro": lucro,
        "imposto_sobre_servico": imposto_sobre_servico,
        "valor_do_lucro": valor_do_lucro,
        "valor_total_sistema": valor_total_sistema,
        "lucro_liquido": lucro_liquido
    }
    
#teste
#valor_do_kit = float(input())
#custo_material_projeto = float(input())
#lucro = float(input())
#imposto_sobre_servico = float(input())

#valor_do_lucro = valor_do_kit * (lucro / 100)
#valor_total_sistema = valor_do_kit + valor_do_lucro + custo_material_projeto
#lucro_liquido = valor_do_lucro - (valor_do_lucro * (imposto_sobre_servico / 100))

#print(valor_do_kit)
#print(custo_material_projeto)
#print(lucro)
#print(imposto_sobre_servico)
#print(valor_do_lucro)
#print(valor_total_sistema)
#print(lucro_liquido)