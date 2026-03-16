import api from "./api.ts";

export interface DocumentoPropostaPayload {
  dimensionamento: number;
  calculo_financeiro?: number | null;
  company_name?: string;
  company_cnpj?: string;
  proposal_title?: string;
  proposal_date?: string;
  validity_days?: number;
  responsible_name?: string;
  responsible_contact?: string;
  generation_warning?: string;
  contract_terms?: string;
  included_services?: string;
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

export interface PreviewStateResponse {
  id: number;
  dimensionamento: number;
  template: number | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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

export async function obterPreviewPropostaState(dimensionamentoId: number | string) {
  const response = await api.get<PreviewStateResponse>(
    `/documentos/preview-state/${dimensionamentoId}/`
  );
  return response.data;
}

export async function salvarPreviewPropostaState(
  dimensionamentoId: number | string,
  data: Record<string, unknown>
) {
  const response = await api.put<PreviewStateResponse>(
    `/documentos/preview-state/${dimensionamentoId}/`,
    { data }
  );
  return response.data;
}
