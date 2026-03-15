import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ArrowLeft,
  Calendar,
  DollarSign,
  Download,
  FileText,
  XCircle,
  Sun,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import {
  atualizarStatusProposta,
  obterPropostaDetalhe,
  type PropostaStatus,
  type PropostaDetalhe,
} from "../../services/propostaService.ts";
import { gerarPdfProposta } from "../../services/documentosService.ts";
import { formatarMoeda } from "../../utils/formatters.ts";

function statusPillClass(status: "pending" | "accepted" | "rejected") {
  if (status === "accepted") {
    return "bg-green-100 text-green-700 border-green-200";
  }
  if (status === "rejected") {
    return "bg-red-100 text-red-700 border-red-200";
  }
  return "bg-yellow-100 text-yellow-700 border-yellow-200";
}

function statusLabel(status: "pending" | "accepted" | "rejected") {
  if (status === "accepted") {
    return "Aceita";
  }
  if (status === "rejected") {
    return "Recusada";
  }
  return "Pendente";
}

export default function PropostaDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [proposta, setProposta] = useState<PropostaDetalhe | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  useEffect(() => {
    async function carregarDetalhe() {
      if (!id) {
        return;
      }

      setIsLoading(true);
      try {
        const data = await obterPropostaDetalhe(id);
        setProposta(data);
      } catch {
        toast.error("Não foi possível carregar a proposta.");
        setProposta(null);
      } finally {
        setIsLoading(false);
      }
    }

    carregarDetalhe();
  }, [id]);

  const parcelasOrdenadas = useMemo(() => {
    if (!proposta) {
      return [] as Array<[string, number]>;
    }

    return Object.entries(proposta.dimensionamento.financiamento_parcelas)
      .map(([meses, valor]) => [meses, Number(valor)] as [string, number])
      .sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [proposta]);

  const handleStatusChange = async (novoStatus: PropostaStatus) => {
    if (!proposta || !id) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await atualizarStatusProposta(id, novoStatus);
      setProposta((atual) => (atual ? { ...atual, status: novoStatus } : atual));

      const label =
        novoStatus === "accepted"
          ? "Aceita"
          : novoStatus === "rejected"
            ? "Recusada"
            : "Pendente";
      toast.success(`Status atualizado para: ${label}`);
    } catch {
      toast.error("Não foi possível atualizar o status da proposta.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExportPdf = async () => {
    if (!proposta) {
      return;
    }

    setIsExportingPdf(true);
    try {
      const blob = await gerarPdfProposta({
        dimensionamento: proposta.dimensionamento.id,
        calculo_financeiro: proposta.financeiro?.id,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `proposta-${proposta.dimensionamento.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("PDF gerado com sucesso.");
    } catch {
      toast.error("Não foi possível gerar o PDF da proposta.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-gray-500">
          Carregando proposta...
        </div>
      </div>
    );
  }

  if (!proposta) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-gray-500">Proposta não encontrada</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Dashboard
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Proposta Comercial</h1>
            <p className="text-gray-600 mt-1">
              {proposta.cliente.nome} - {proposta.cliente.consumo_kwh_mes} kWh/mês
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/documentos?dimensionamento=${proposta.dimensionamento.id}${
                    proposta.financeiro?.id ? `&financeiro=${proposta.financeiro.id}` : ""
                  }`
                )
              }
              className="flex items-center gap-2 bg-white text-orange-600 border border-orange-200 px-6 py-3 rounded-lg font-medium hover:bg-orange-50 transition-colors"
            >
              <FileText className="w-5 h-5" />
              Gerar Documentos
            </button>
            <button
              type="button"
              disabled={isExportingPdf}
              onClick={handleExportPdf}
              className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:bg-orange-300"
            >
              <Download className="w-5 h-5" />
              {isExportingPdf ? "Gerando PDF..." : "Exportar PDF"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Status da Proposta</p>
                <span
                  className={`inline-flex px-4 py-2 rounded-lg text-sm font-medium border ${statusPillClass(proposta.status)}`}
                >
                  {statusLabel(proposta.status)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange("pending")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    proposta.status === "pending"
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Pendente
                </button>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange("accepted")}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    proposta.status === "accepted"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Aceita
                </button>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => setShowRejectConfirm(true)}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    proposta.status === "rejected"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Recusada
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Cliente</p>
              <p className="font-medium text-gray-800 mt-1">{proposta.cliente.nome}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Localização</p>
              <p className="font-medium text-gray-800 mt-1">
                {proposta.cliente.cidade}, {proposta.cliente.estado}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Telefone</p>
              <p className="font-medium text-gray-800 mt-1">
                {proposta.cliente.telefone || "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Data</p>
              <p className="font-medium text-gray-800 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {proposta.dimensionamento.created_at}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-6 h-6" />
            <h2 className="text-xl font-bold">Dimensionamento do Sistema</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-orange-100 text-sm">Potência Total</p>
              <p className="text-2xl font-bold mt-1">
                {proposta.dimensionamento.potencia_calculada_kwp.toFixed(2)} kWp
              </p>
            </div>
            <div>
              <p className="text-orange-100 text-sm">Valor do Sistema</p>
              <p className="text-2xl font-bold mt-1">
                {formatarMoeda(proposta.dimensionamento.valor_total_sistema)}
              </p>
            </div>
            <div>
              <p className="text-orange-100 text-sm">Consumo Cliente</p>
              <p className="text-2xl font-bold mt-1">
                {proposta.cliente.consumo_kwh_mes.toFixed(0)} kWh
              </p>
            </div>
            <div>
              <p className="text-orange-100 text-sm">Lucro Empresa</p>
              <p className="text-2xl font-bold mt-1">
                {formatarMoeda(proposta.dimensionamento.lucro_liquido_empresa)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-800">Investimento</h2>
            </div>
            <p className="text-sm text-gray-600">Valor Total do Sistema</p>
            <p className="text-4xl font-bold text-gray-800 mt-1">
              {formatarMoeda(proposta.dimensionamento.valor_total_sistema)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-800">Financiamento</h2>
            </div>
            <div className="space-y-1">
              {parcelasOrdenadas.map(([meses, valor]) => (
                <p key={meses} className="text-sm text-gray-600">
                  {meses}x de <strong>{formatarMoeda(valor)}</strong>
                </p>
              ))}
            </div>
          </div>
        </div>

        {proposta.financeiro && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">Retorno Financeiro</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Economia mensal</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatarMoeda(proposta.financeiro.economia_mensal_rs)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Economia anual</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {formatarMoeda(proposta.financeiro.economia_anual_rs)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payback</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {proposta.financeiro.payback_anos.toFixed(2)} anos
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showRejectConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Confirmar recusa da proposta
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Deseja realmente alterar o status para <strong>Recusada</strong>?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRejectConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={async () => {
                  await handleStatusChange("rejected");
                  setShowRejectConfirm(false);
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:bg-red-300"
              >
                Confirmar recusa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
