import api from "./api.ts";

export interface FinanceiroPayload {
  dimensionamento: number;
  tarifa_energia_kwh: number;
  custo_disponibilidade_rs?: number;
}

export interface FinanceiroResposta {
  id: number;
  dimensionamento: number;
  tarifa_energia_kwh: string;
  custo_disponibilidade_rs: string;
  investimento_total_rs: string;
  geracao_mensal_kwh: string;
  economia_mensal_rs: string;
  economia_anual_rs: string;
  payback_meses: string;
  payback_anos: string;
  economia_25_anos_rs: string;
  created_at: string;
  updated_at: string;
}

export async function calcularFinanceiro(dados: FinanceiroPayload) {
  const response = await api.post<FinanceiroResposta>(
    "/financeiro/calcular/",
    dados
  );
  return response.data;
}
