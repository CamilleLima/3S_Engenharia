# TODO: implementar a lógica de geração de relatórios aqui

def gerar_dados_relatorio(
    dados_cliente: dict,
    resultado_dimensionamento: dict,
    resultado_financeiro: dict,
    # Campos editáveis que vêm do front-end
    texto_adicional: str | None = None,
    imagem_extra_path: str | None = None,
) -> dict:
    """
    Consolida os dados do cliente, dimensionamento e financeiro em uma
    estrutura única para ser usada no relatório editável (RF4) e no PDF (RF5).

    Args:
        dados_cliente (dict): Dicionário com informações do cliente.
        resultado_dimensionamento (dict): Resultado do service de dimensionamento.
        resultado_financeiro (dict): Resultado do service financeiro.
        texto_adicional (str, optional): Texto livre inserido pelo vendedor.
        imagem_extra_path (str, optional): Caminho absoluto no sistema de arquivos para a imagem de anexo.

    Returns:
        dict: Dicionário consolidado com os dados da proposta.
    """
    
    # Extrai e formata os dados de cada fonte
    dados_proposta = {
        "nome_cliente": dados_cliente.get("nome", "Não informado"),
        "cidade_uf": f"{dados_cliente.get('cidade', '')}/{dados_cliente.get('estado', '')}",
        
        "potencia_sistema_kwp": resultado_dimensionamento.get("potencia_final_kwp"),
        "quantidade_paineis": resultado_dimensionamento.get("quantidade_paineis"),
        "marca_painel": resultado_dimensionamento.get("kit_solar", {}).get("marca_painel", "N/A"),
        
        "economia_mensal_rs": resultado_financeiro.get("economia_mensal_rs"),
        "payback_anos": resultado_financeiro.get("payback_anos"),
        "investimento_total_rs": resultado_financeiro.get("investimento_total_rs"),

        # Adiciona os campos editáveis ao contexto
        "texto_adicional": texto_adicional,
        "imagem_extra_path": imagem_extra_path,
    }

    return dados_proposta