import api from "./api.ts";

export interface DimensionamentoPayload {
  [key: string]: unknown;
}

export async function calcularDimensionamento(dados: DimensionamentoPayload) {
  const response = await api.post("/dimensionamento/calcular/", dados);
  return response.data;
}
