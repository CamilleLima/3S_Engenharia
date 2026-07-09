import { useState, type FormEvent } from "react";
import { Calculator, CircleDollarSign, Download, FileText, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  calcularFinanceiro,
  type FinanceiroResposta,
} from "../../services/financeiroService.ts";
import { formatarMoeda } from "../../utils/formatters.ts";

function extractFirstErrorMessage(detail: unknown): string | null {
  if (!detail) {
    return null;
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    for (const item of detail) {
      const message = extractFirstErrorMessage(item);
      if (message) {
        return message;
      }
    }
    return null;
  }

  if (typeof detail === "object") {
    for (const value of Object.values(detail as Record<string, unknown>)) {
      const message = extractFirstErrorMessage(value);
      if (message) {
        return message;
      }
    }
  }

  return null;
}

export default function Financeiro() {
  const navigate = useNavigate();
  const [dimensionamentoId, setDimensionamentoId] = useState("");
  const [tarifaEnergia, setTarifaEnergia] = useState("0.95");
  const [custoDisponibilidade, setCustoDisponibilidade] = useState("50");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultado, setResultado] = useState<FinanceiroResposta | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    try {
      const response = await calcularFinanceiro({
        dimensionamento: Number(dimensionamentoId),
        tarifa_energia_kwh: Number(tarifaEnergia),
        custo_disponibilidade_rs: Number(custoDisponibilidade),
      });

      setResultado(response);
      toast.success("Cálculo financeiro realizado com sucesso.");
    } catch (error: any) {
      const detail = error?.response?.data;
      const message = extractFirstErrorMessage(detail);
      toast.error(message || "Falha ao calcular retorno financeiro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Retorno Financeiro</h2>
          <p className="text-gray-600 mt-1">
            Calcule payback e economia com base em um dimensionamento existente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-800">Parâmetros (RF3)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID do Dimensionamento *
              </label>
              <input
                type="number"
                min="1"
                value={dimensionamentoId}
                onChange={(e) => setDimensionamentoId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: 12"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarifa de Energia (R$/kWh) *
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={tarifaEnergia}
                onChange={(e) => setTarifaEnergia(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: 0.95"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custo de Disponibilidade (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={custoDisponibilidade}
                onChange={(e) => setCustoDisponibilidade(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: 50"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
            >
              <Calculator className="w-5 h-5" />
              {isSubmitting ? "Calculando..." : "Calcular RF3"}
            </button>
          </div>
        </form>
      </div>

      {resultado && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Resultado do Cálculo Financeiro
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(`/proposta/${dimensionamentoId}`)
                }
                className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Ver Proposta
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/documentos?dimensionamento=${dimensionamentoId}&financeiro=${resultado.id}`
                  )
                }
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Gerar Documentos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500">Investimento total</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatarMoeda(Number(resultado.investimento_total_rs))}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500">Economia mensal</p>
              <p className="text-lg font-semibold text-green-700">
                {formatarMoeda(Number(resultado.economia_mensal_rs))}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500">Payback</p>
              <p className="text-lg font-semibold text-gray-800">
                {Number(resultado.payback_anos).toFixed(2)} anos
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                Economia anual: {" "}
                <strong>{formatarMoeda(Number(resultado.economia_anual_rs))}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Geração mensal estimada: {" "}
                <strong>{Number(resultado.geracao_mensal_kwh).toFixed(2)} kWh</strong>
              </p>
            </div>

            <div className="p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                Economia em 25 anos: {" "}
                <strong>{formatarMoeda(Number(resultado.economia_25_anos_rs))}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Payback em meses: {" "}
                <strong>{Number(resultado.payback_meses).toFixed(2)}</strong>
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}
