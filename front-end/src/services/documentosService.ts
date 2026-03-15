import api from "./api.ts";

export interface DocumentoPropostaPayload {
  dimensionamento: number;
  calculo_financeiro?: number | null;
  texto_adicional?: string;
  imagem_extra_path?: string;
}

export interface DocumentoRelatorioResposta {
  nome_cliente: string;
  cidade_uf: string;
  potencia_sistema_kwp: number;
  quantidade_paineis: number | null;
  marca_painel: string;
  economia_mensal_rs: number;
  payback_anos: number;
  investimento_total_rs: number;
  texto_adicional?: string | null;
  imagem_extra_path?: string | null;
  [key: string]: unknown;
}

export async function gerarRelatorioProposta(dados: DocumentoPropostaPayload) {
  const response = await api.post<DocumentoRelatorioResposta>(
    "/documentos/relatorio/",
    dados
  );
  return response.data;
}

export async function gerarPdfProposta(dados: DocumentoPropostaPayload) {
  const response = await api.post("/documentos/proposta-pdf/", dados, {
    responseType: "blob",
  });

  return response.data;
}
