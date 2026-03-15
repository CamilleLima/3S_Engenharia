import pytest


@pytest.mark.django_db
class TestDocumentos:
    """Testes de geração de relatório e PDF."""

    def test_gerar_dados_relatorio_consolida_campos(self):
        from apps.documentos.generators.relatorio import gerar_dados_relatorio

        dados = gerar_dados_relatorio(
            dados_cliente={"nome": "Cliente X", "cidade": "Rio Branco", "estado": "AC"},
            resultado_dimensionamento={
                "potencia_final_kwp": 2.81,
                "quantidade_paineis": 5,
                "kit_solar": {"marca_painel": "Marca X"},
            },
            resultado_financeiro={
                "economia_mensal_rs": 234.85,
                "payback_anos": 6.55,
                "investimento_total_rs": 18470.00,
            },
            texto_adicional="Observação teste",
        )

        assert dados["nome_cliente"] == "Cliente X"
        assert dados["cidade_uf"] == "Rio Branco/AC"
        assert dados["potencia_sistema_kwp"] == 2.81
        assert dados["economia_mensal_rs"] == 234.85
        assert dados["texto_adicional"] == "Observação teste"

    def test_gerar_pdf_com_mock_weasyprint(self, monkeypatch):
        import os

        from apps.documentos.generators.pdf import gerar_proposta_pdf

        class FakeHTML:
            def __init__(self, string):
                self.string = string

            def write_pdf(self, path):
                with open(path, "wb") as pdf_file:
                    pdf_file.write(b"%PDF-1.4 fake")

        class FakeWeasyPrintModule:
            HTML = FakeHTML

        monkeypatch.setattr(
            "apps.documentos.generators.pdf.render_to_string",
            lambda _template, _ctx: "<html><body>ok</body></html>",
        )
        monkeypatch.setattr(
            "apps.documentos.generators.pdf.import_module",
            lambda _name: FakeWeasyPrintModule,
        )

        pdf_path = gerar_proposta_pdf({"nome_cliente": "Cliente X"})

        try:
            assert pdf_path.endswith(".pdf")
            with open(pdf_path, "rb") as generated_file:
                assert generated_file.read().startswith(b"%PDF")
        finally:
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
