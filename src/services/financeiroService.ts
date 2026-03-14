import api from "./api.ts";

export interface FinanceiroPayload {
  [key: string]: unknown;
}

export async function calcularFinanceiro(dados: FinanceiroPayload) {
  const response = await api.post("/financeiro/calcular/", dados);
  return response.data;
}
