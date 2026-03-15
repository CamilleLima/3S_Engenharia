import io
import tempfile

from django.template.loader import render_to_string


def _gerar_com_xhtml2pdf(html_string: str, pdf_path: str) -> None:
    """Gera PDF com xhtml2pdf (dependência padrão, puro Python)."""
    from xhtml2pdf import pisa  # type: ignore[import-untyped]

    with open(pdf_path, "wb") as output_file:
        result = pisa.CreatePDF(io.StringIO(html_string), dest=output_file)

    if result.err:
        raise RuntimeError(f"xhtml2pdf falhou ao gerar o PDF (erros: {result.err}).")


def _gerar_com_weasyprint(html_string: str, pdf_path: str) -> None:
    """Gera PDF com WeasyPrint (fallback, requer dependências do sistema)."""
    from importlib import import_module

    html_class = import_module("weasyprint").HTML
    html_class(string=html_string).write_pdf(pdf_path)


def gerar_proposta_pdf(dados_proposta: dict) -> str:
    """
    Recebe os dados consolidados da proposta, renderiza um template HTML
    e o converte para um arquivo PDF.

    O backend preferido é xhtml2pdf (puro Python). Se não estiver disponível,
    tenta WeasyPrint como fallback.

    Args:
        dados_proposta (dict): Dicionário completo retornado por
            `gerar_dados_relatorio`, incluindo os campos editáveis.

    Returns:
        str: Caminho para o arquivo PDF temporário gerado.
             A view chamadora é responsável por remover o arquivo.
    """
    html_string = render_to_string("documentos/proposta.html", dados_proposta)

    pdf_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    pdf_path = pdf_file.name
    pdf_file.close()

    try:
        _gerar_com_xhtml2pdf(html_string, pdf_path)
    except ImportError:
        try:
            _gerar_com_weasyprint(html_string, pdf_path)
        except ImportError as exc:
            raise RuntimeError(
                "Nenhuma biblioteca de geração de PDF disponível. "
                "Instale 'xhtml2pdf' ou 'weasyprint'."
            ) from exc

    return pdf_path
