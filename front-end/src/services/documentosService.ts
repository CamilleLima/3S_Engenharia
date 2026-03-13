import api from "./api.ts";

export async function gerarPdf(propostaId: number | string) {
  const response = await api.get(`/documentos/propostas/${propostaId}/pdf/`, {
    responseType: "blob",
  });

  return response.data;
}
