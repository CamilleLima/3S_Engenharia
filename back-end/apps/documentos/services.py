from typing import TYPE_CHECKING

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
            }
        )
        return dados
