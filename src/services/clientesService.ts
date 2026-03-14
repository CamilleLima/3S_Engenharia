import api from "./api.ts";

export interface Vendedor {
  id: number;
  nome: string;
  cargo: string;
  telefone: string;
  email: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CriarVendedorPayload {
  nome: string;
  cargo: string;
  telefone: string;
  email: string;
}

export interface CriarClientePayload {
  nome: string;
  cpf: string;
  telefone?: string;
  email?: string;
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
  numero: string;
  consumo_kwh_mes: number;
  tipo_ligacao: "monofasico" | "bifasico" | "trifasico";
  tipo_telhado: "ceramico" | "metalico" | "laje" | "fibrocimento";
  vendedor: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function normalizarLista<T>(data: PaginatedResponse<T> | T[]): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data.results || [];
}

export async function listarVendedores(params: Record<string, string> = {}) {
  const response = await api.get<PaginatedResponse<Vendedor> | Vendedor[]>(
    "/clientes/vendedores/",
    { params }
  );

  return normalizarLista(response.data);
}

export async function criarVendedor(dados: CriarVendedorPayload) {
  const response = await api.post<Vendedor>("/clientes/vendedores/", dados);
  return response.data;
}

export async function criarCliente(dados: CriarClientePayload) {
  const response = await api.post("/clientes/", dados);
  return response.data;
}
