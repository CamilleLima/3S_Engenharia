import api from "./api.ts";

export type BudgetStatus = "pending" | "accepted" | "rejected";

export interface DashboardBudget {
  id: string;
  clientName: string;
  city: string;
  power: number;
  value: number;
  date: string;
  status: BudgetStatus;
  consumption: number;
}

export interface DashboardResumoResposta {
  total_budgets: number;
  total_value: number;
  accepted_count: number;
  budgets: DashboardBudget[];
}

export async function obterDashboardResumo() {
  const response = await api.get<DashboardResumoResposta>('/dimensionamento/dashboard/');
  return response.data;
}
