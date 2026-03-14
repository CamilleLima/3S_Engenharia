import tempfile

from django.template.loader import render_to_string
from weasyprint import HTML

# TODO: implementar a lógica de geração de PDF aqui

def gerar_proposta_pdf(dados_proposta: dict) -> str:
    """
    Recebe os dados consolidados da proposta, renderiza um template HTML
    e o converte para um arquivo PDF usando WeasyPrint.

    Args:
        dados_proposta (dict): Dicionário completo retornado por `gerar_dados_relatorio`,
                               incluindo os campos editáveis.

    Returns:
        str: O caminho para o arquivo PDF temporário gerado.
             A view que chama esta função é responsável por limpar o arquivo.
    """
    # 1. Renderiza o template HTML com os dados da proposta
    html_string = render_to_string("documentos/proposta.html", dados_proposta)

    # 2. Cria um arquivo temporário para salvar o PDF
    # Usamos delete=False para que o arquivo não seja apagado ao ser fechado.
    pdf_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)

    # 3. Gera o PDF a partir do HTML renderizado e o salva no caminho do arquivo temporário
    # WeasyPrint consegue resolver caminhos de arquivos locais passados no HTML.
    HTML(string=html_string).write_pdf(pdf_file.name)

    return pdf_file.name