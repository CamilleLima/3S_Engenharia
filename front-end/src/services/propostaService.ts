import api from "./api.ts";

export interface PropostaDetalhe {
  cliente: {
    id: number;
    nome: string;
    cidade: string;
    estado: string;
    telefone: string;
    email: string;
    consumo_kwh_mes: number;
    tipo_ligacao: string;
    tipo_telhado: string;
  };
  dimensionamento: {
    id: number;
    potencia_calculada_kwp: number;
    valor_total_sistema: number;
    lucro_liquido_empresa: number;
    irradiacao_media_cidade: number;
    fator_perda_decimal: number;
    financiamento_parcelas: Record<string, number>;
    created_at: string;
  };
  financeiro: {
    id: number;
    investimento_total_rs: number;
    geracao_mensal_kwh: number;
    economia_mensal_rs: number;
    economia_anual_rs: number;
    payback_meses: number;
    payback_anos: number;
    economia_25_anos_rs: number;
  } | null;
  status: "pending" | "accepted" | "rejected";
}

export type PropostaStatus = "pending" | "accepted" | "rejected";

export async function obterPropostaDetalhe(dimensionamentoId: string | number) {
  const response = await api.get<PropostaDetalhe>(
    `/dimensionamento/${dimensionamentoId}/detalhe/`
  );
  return response.data;
}

export async function atualizarStatusProposta(
  dimensionamentoId: string | number,
  status: PropostaStatus
) {
  const response = await api.patch<{ id: number; status: PropostaStatus }>(
    `/dimensionamento/${dimensionamentoId}/status/`,
    { status }
  );
  return response.data;
}
