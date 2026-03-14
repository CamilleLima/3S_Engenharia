import api from "./api.ts";
import type { CriarClientePayload } from "./clientesService.ts";

export interface DimensionamentoPayload {
  [key: string]: unknown;
}

export interface OrcamentoEtapasDimensionamentoPayload {
  uf: string;
  latitude_cliente: number;
  longitude_cliente: number;
  custo_kit?: number;
  custo_adicionais?: number;
  margem_lucro_decimal?: number;
  imposto_servico_decimal?: number;
  taxa_juros_mensal_decimal?: number;
}

export interface OrcamentoEtapasPayload {
  cliente: CriarClientePayload;
  dimensionamento: OrcamentoEtapasDimensionamentoPayload;
}

export interface OrcamentoEtapasResposta {
  cliente_id: number;
  geo: {
    uf: string;
    fator_perda_decimal: number;
    irradiacao_media_cidade: number;
    inclinacao_ideal_graus: number;
    estacao_mais_proxima: {
      id: string;
      distancia_km: number;
    };
  };
  dimensionamento: {
    id: number;
    potencia_calculada_kwp: number;
    valor_total_sistema: number;
    lucro_liquido_empresa: number;
    financiamento_parcelas: Record<string, number>;
  };
}

export async function calcularDimensionamento(dados: DimensionamentoPayload) {
  const response = await api.post("/dimensionamento/calcular/", dados);
  return response.data;
}

export async function criarOrcamentoEmEtapas(dados: OrcamentoEtapasPayload) {
  const response = await api.post<OrcamentoEtapasResposta>(
    "/dimensionamento/orcamento/etapas/",
    dados
  );
  return response.data;
}
