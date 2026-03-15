import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import {
  gerarPdfProposta,
  gerarRelatorioProposta,
  type DocumentoRelatorioResposta,
} from "../../services/documentosService.ts";
import { formatarMoeda } from "../../utils/formatters.ts";

function baixarBlob(blob: Blob, nomeArquivo: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function Documentos() {
  const [searchParams] = useSearchParams();
  const [dimensionamentoId, setDimensionamentoId] = useState(
    searchParams.get("dimensionamento") ?? ""
  );
  const [financeiroId, setFinanceiroId] = useState(searchParams.get("financeiro") ?? "");
  const [textoAdicional, setTextoAdicional] = useState("");
  const [imagemExtraPath, setImagemExtraPath] = useState("");

  const [relatorio, setRelatorio] = useState<DocumentoRelatorioResposta | null>(null);
  const [isLoadingRelatorio, setIsLoadingRelatorio] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  const payloadBase = useMemo(() => {
    const idNumerico = Number(dimensionamentoId);
    const financeiroNumerico = Number(financeiroId);

    if (!idNumerico || Number.isNaN(idNumerico)) {
      return null;
    }

    return {
      dimensionamento: idNumerico,
      calculo_financeiro:
        financeiroId.trim() && !Number.isNaN(financeiroNumerico)
          ? financeiroNumerico
          : undefined,
      texto_adicional: textoAdicional.trim() || undefined,
      imagem_extra_path: imagemExtraPath.trim() || undefined,
    };
  }, [dimensionamentoId, financeiroId, textoAdicional, imagemExtraPath]);

  const handleGerarRelatorio = async () => {
    if (!payloadBase) {
      toast.error("Informe um ID de dimensionamento válido.");
      return;
    }

    setIsLoadingRelatorio(true);
    try {
      const dados = await gerarRelatorioProposta(payloadBase);
      setRelatorio(dados);
      toast.success("Relatório carregado com sucesso.");
    } catch {
      toast.error("Não foi possível gerar o relatório.");
      setRelatorio(null);
    } finally {
      setIsLoadingRelatorio(false);
    }
  };

  const handleGerarPdf = async () => {
    if (!payloadBase) {
      toast.error("Informe um ID de dimensionamento válido.");
      return;
    }

    setIsLoadingPdf(true);
    try {
      const blob = await gerarPdfProposta(payloadBase);
      baixarBlob(blob, `proposta-${payloadBase.dimensionamento}.pdf`);
      toast.success("PDF gerado com sucesso.");
    } catch {
      toast.error("Não foi possível gerar o PDF da proposta.");
    } finally {
      setIsLoadingPdf(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800">Documentos da Proposta</h2>
        <p className="text-gray-600 mt-2">
          Gere o relatório consolidado (RF4) e o PDF final (RF5) com dados reais.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">ID do Dimensionamento *</label>
            <input
              type="number"
              min={1}
              value={dimensionamentoId}
              onChange={(event) => setDimensionamentoId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ex.: 12"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">ID do Cálculo Financeiro</label>
            <input
              type="number"
              min={1}
              value={financeiroId}
              onChange={(event) => setFinanceiroId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Texto adicional</label>
            <textarea
              value={textoAdicional}
              onChange={(event) => setTextoAdicional(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Observações comerciais opcionais"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Caminho de imagem extra</label>
            <input
              type="text"
              value={imagemExtraPath}
              onChange={(event) => setImagemExtraPath(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Opcional (caminho absoluto no servidor)"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGerarRelatorio}
            disabled={isLoadingRelatorio || isLoadingPdf}
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 disabled:bg-orange-300"
          >
            <FileText className="w-4 h-4" />
            {isLoadingRelatorio ? "Gerando relatório..." : "Gerar Relatório (RF4)"}
          </button>
          <button
            type="button"
            onClick={handleGerarPdf}
            disabled={isLoadingRelatorio || isLoadingPdf}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-500"
          >
            <Download className="w-4 h-4" />
            {isLoadingPdf ? "Gerando PDF..." : "Baixar PDF (RF5)"}
          </button>
        </div>
      </div>

      {relatorio && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-800">Prévia do Relatório</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Cliente</p>
              <p className="font-semibold text-gray-800 mt-1">{relatorio.nome_cliente}</p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Cidade/UF</p>
              <p className="font-semibold text-gray-800 mt-1">{relatorio.cidade_uf}</p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Potência do sistema</p>
              <p className="font-semibold text-gray-800 mt-1">
                {Number(relatorio.potencia_sistema_kwp).toFixed(2)} kWp
              </p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Investimento total</p>
              <p className="font-semibold text-gray-800 mt-1">
                {formatarMoeda(Number(relatorio.investimento_total_rs))}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Economia mensal</p>
              <p className="font-semibold text-green-700 mt-1">
                {formatarMoeda(Number(relatorio.economia_mensal_rs))}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Payback</p>
              <p className="font-semibold text-gray-800 mt-1">
                {Number(relatorio.payback_anos).toFixed(2)} anos
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
