from typing import TYPE_CHECKING
from datetime import datetime, timedelta

from apps.clientes.models import Cliente
from apps.dimensionamento.models import Dimensionamento

from .generators.relatorio import gerar_dados_relatorio

if TYPE_CHECKING:
    from apps.financeiro.models import CalculoFinanceiro


class DocumentoPropostaService:
    """Orquestra a consolidação de dados para relatório/PDF da proposta."""

    @staticmethod
    def montar_dados_proposta(
        *,
        dimensionamento: Dimensionamento,
        calculo_financeiro: "CalculoFinanceiro",
        company_name: str | None = None,
        company_cnpj: str | None = None,
        proposal_title: str | None = None,
        proposal_date: str | None = None,
        validity_days: int | None = None,
        responsible_name: str | None = None,
        responsible_contact: str | None = None,
        generation_warning: str | None = None,
        contract_terms: str | None = None,
        included_services: str | None = None,
        texto_adicional: str | None = None,
        imagem_extra_path: str | None = None,
    ) -> dict:
        cliente: Cliente = dimensionamento.cliente

        dados_cliente = {
            "nome": cliente.nome,
            "cidade": cliente.cidade,
            "estado": cliente.estado,
            "cpf": cliente.cpf,
            "telefone": cliente.telefone,
            "email": cliente.email,
            "endereco_completo": cliente.endereco_completo,
            "vendedor_nome": cliente.vendedor.nome,
            "vendedor_cargo": cliente.vendedor.cargo,
        }

        resultado_dimensionamento = {
            "potencia_final_kwp": float(dimensionamento.potencia_calculada_kwp),
            "quantidade_paineis": dimensionamento.financiamento_parcelas.get(
                "quantidade_paineis"
            ),
            "kit_solar": {
                # Marca ainda depende de escolha do vendedor no fluxo comercial
                "marca_painel": "A definir",
            },
            "valor_total_sistema": float(dimensionamento.valor_total_sistema),
            "lucro_liquido_empresa": float(dimensionamento.lucro_liquido_empresa),
            "financiamento_parcelas": dimensionamento.financiamento_parcelas,
        }

        resultado_financeiro = {
            "economia_mensal_rs": float(calculo_financeiro.economia_mensal_rs),
            "payback_anos": float(calculo_financeiro.payback_anos),
            "investimento_total_rs": float(calculo_financeiro.investimento_total_rs),
            "economia_anual_rs": float(calculo_financeiro.economia_anual_rs),
            "economia_25_anos_rs": float(calculo_financeiro.economia_25_anos_rs),
        }

        dados = gerar_dados_relatorio(
            dados_cliente=dados_cliente,
            resultado_dimensionamento=resultado_dimensionamento,
            resultado_financeiro=resultado_financeiro,
            texto_adicional=texto_adicional,
            imagem_extra_path=imagem_extra_path,
        )

        data_base = datetime.now()
        validade_dias = validity_days or 7
        data_proposta = proposal_date or data_base.strftime("%d/%m/%Y")
        data_validade = (data_base + timedelta(days=validade_dias)).strftime("%d/%m/%Y")

        servicos_inclusos = [
            item.strip()
            for item in (included_services or "").split("\n")
            if item.strip()
        ]
        if not servicos_inclusos:
            servicos_inclusos = [
                "Vistoria técnica",
                "Projeto elétrico",
                "ART de projeto e instalação",
                "Homologação junto à concessionária",
                "Instalação dos módulos e inversores",
                "Comissionamento do sistema",
            ]

        dados.update(
            {
                "dimensionamento_id": dimensionamento.pk,
                "calculo_financeiro_id": calculo_financeiro.pk,
                "endereco_completo": cliente.endereco_completo,
                "cpf": cliente.cpf,
                "telefone": cliente.telefone,
                "email": cliente.email,
                "vendedor_nome": cliente.vendedor.nome,
                "vendedor_cargo": cliente.vendedor.cargo,
                "valor_total_sistema": float(dimensionamento.valor_total_sistema),
                "lucro_liquido_empresa": float(dimensionamento.lucro_liquido_empresa),
                "economia_anual_rs": float(calculo_financeiro.economia_anual_rs),
                "economia_25_anos_rs": float(calculo_financeiro.economia_25_anos_rs),
                "company_name": (company_name or "3S Engenharia"),
                "company_cnpj": (company_cnpj or "30.635.438/0001-07"),
                "proposal_title": (
                    proposal_title or "Proposta Comercial Sistema de Energia Solar"
                ),
                "proposal_date": data_proposta,
                "validity_days": validade_dias,
                "validity_date": data_validade,
                "responsible_name": (responsible_name or cliente.vendedor.nome),
                "responsible_contact": (responsible_contact or ""),
                "generation_warning": (
                    generation_warning
                    or "IMPORTANTE: Os valores de geração e economia são "
                    "estimativas baseadas no consumo informado, irradiação média "
                    "da região e condições de projeto. Os resultados reais podem "
                    "variar conforme clima, sombreamento, orientação dos módulos "
                    "e variações tarifárias."
                ),
                "contract_terms": (
                    contract_terms
                    or "Declaro que li e concordo com os termos desta proposta "
                    "comercial para instalação de sistema de energia solar."
                ),
                "included_services_list": servicos_inclusos,
            }
        )
        return dados
