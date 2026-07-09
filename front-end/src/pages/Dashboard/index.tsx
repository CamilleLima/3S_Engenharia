import { useEffect, useMemo, useState } from "react";
import { DollarSign, Plus, Search, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  obterDashboardResumo,
  type DashboardBudget,
} from "../../services/dashboardService.ts";

export default function Dashboard() {
  const [budgets, setBudgets] = useState<DashboardBudget[]>([]);
  const [totalBudgets, setTotalBudgets] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function carregarDashboard() {
      setIsLoading(true);
      try {
        const data = await obterDashboardResumo();
        setBudgets(data.budgets);
        setTotalBudgets(data.total_budgets);
        setTotalValue(data.total_value);
        setAcceptedCount(data.accepted_count);
      } catch {
        toast.error("Não foi possível carregar os dados da dashboard.");
        setBudgets([]);
        setTotalBudgets(0);
        setTotalValue(0);
        setAcceptedCount(0);
      } finally {
        setIsLoading(false);
      }
    }

    carregarDashboard();
  }, []);

  const filteredBudgets = useMemo(
    () =>
      budgets.filter(
        (budget) =>
          budget.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          budget.city.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [budgets, searchTerm]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Orçamentos</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {totalBudgets}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {totalValue.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Propostas Aceitas</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {acceptedCount}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Orçamentos</h2>
              <p className="text-gray-600 mt-1">
                Gerencie suas propostas comerciais
              </p>
            </div>
            <button
              onClick={() => navigate("/novo-orcamento")}
              className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Orçamento
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {filteredBudgets.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm
                  ? "Nenhum orçamento encontrado"
                  : "Nenhum orçamento criado ainda"}
              </p>
              {!searchTerm && !isLoading && (
                <button
                  onClick={() => navigate("/novo-orcamento")}
                  className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
                >
                  Criar primeiro orçamento
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Cidade
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Potência
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Valor
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Data
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 px-4 text-center text-gray-500"
                      >
                        Carregando dados...
                      </td>
                    </tr>
                  ) : (
                    filteredBudgets.map((budget) => (
                      <tr
                        key={budget.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4 font-medium text-gray-800">
                          {budget.clientName}
                        </td>
                        <td className="py-4 px-4 text-gray-600">{budget.city}</td>
                        <td className="py-4 px-4 text-gray-600">
                          {budget.power.toFixed(2)} kWp
                        </td>
                        <td className="py-4 px-4 text-gray-800 font-medium">
                          {budget.value.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                        <td className="py-4 px-4 text-gray-600">{budget.date}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                              budget.status === "accepted"
                                ? "bg-green-100 text-green-700"
                                : budget.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {budget.status === "accepted"
                              ? "Aceita"
                              : budget.status === "rejected"
                                ? "Recusada"
                                : "Pendente"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => navigate(`/proposta/${budget.id}`)}
                            className="text-orange-600 hover:text-orange-700 font-medium"
                          >
                            Ver Proposta
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
