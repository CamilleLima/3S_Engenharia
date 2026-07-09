import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { obterPropostaDetalhe, type PropostaDetalhe } from "../../services/propostaService.ts";
import { loadConfiguracoes } from "../../services/configuracoesService.ts";
import {
  gerarPdfProposta,
  obterPreviewPropostaState,
  salvarPreviewPropostaState,
} from "../../services/documentosService.ts";
import { formatarMoeda } from "../../utils/formatters.ts";

interface PreviewEditableData {
  companyName: string;
  companyCnpj: string;
  proposalTitle: string;
  proposalDate: string;
  validityDays: string;
  responsibleName: string;
  responsibleContact: string;
  clientName: string;
  clientCityUf: string;
  clientPhone: string;
  clientEmail: string;
  investmentValue: string;
  monthlySavings: string;
  yearlySavings: string;
  paybackYears: string;
  consumptionKwh: string;
  monthlyGenerationKwh: string;
  moduleModel: string;
  moduleManufacturer: string;
  modulePowerWp: string;
  moduleWeightKg: string;
  numberOfPanels: string;
  inverterModel1: string;
  inverterManufacturer1: string;
  inverterPowerKw1: string;
  inverterWarrantyYears1: string;
  inverterModel2: string;
  inverterManufacturer2: string;
  inverterPowerKw2: string;
  inverterWarrantyYears2: string;
  generationWarning: string;
  financialWarning: string;
  contractTerms: string;
  includedServices: string;
}

interface GenerationRow {
  month: string;
  generation: number;
  irradiation: number;
}

interface PreviewDraft {
  editable: PreviewEditableData;
  services: string[];
  servicesNote: string;
  acceptanceText: string;
  validityText: string;
  signatureClientName: string;
  moduleWarrantyProduct: string;
  moduleWarrantyPerformance: string;
  moduleWarrantyYear1: string;
  moduleWarrantyYear25: string;
  installationWarranty: string;
  installationWarrantyText: string;
  clarifications: string[];
  monthlyGenerationData: GenerationRow[];
}

const defaultGenerationWarning =
  "IMPORTANTE: Os valores de geração e economia são estimativas baseadas no consumo informado, irradiação média da região e condições de projeto. Os resultados reais podem variar conforme clima, sombreamento, orientação dos módulos e variações tarifárias.";

const defaultContractTerms =
  "Declaro que li e concordo com os termos desta proposta comercial para instalação de sistema de energia solar.\n\nValidade da proposta: 7 dias a partir da data de emissão.\n\nAs garantias dos equipamentos seguem os respectivos fabricantes. A garantia dos serviços de instalação segue o contrato firmado entre as partes.";

const defaultIncludedServices =
  "Vistoria técnica\nProjeto elétrico\nART de projeto e instalação\nHomologação junto à concessionária\nInstalação dos módulos e inversores\nComissionamento do sistema";

const defaultFinancialWarning =
  "AVISO IMPORTANTE: Os valores de economia e payback são estimativas baseadas no consumo informado, na tarifa de energia e na geração estimada do sistema. A economia real dependerá do consumo efetivo, das variações tarifárias e da geração real.";

const defaultServicesNote =
  "Não Estão Inclusos Obras Civis e Eventuais Reformas No Telhado/Laje e no Padrão de Entrada";

const defaultAcceptanceText =
  "Declaro que li e concordo com os termos desta proposta comercial para instalação de sistema de energia solar.";

const defaultValidityText =
  "Esta proposta tem validade de 7 dias a partir da data de emissão";

const defaultMonthlyGenerationData: GenerationRow[] = [
  { month: "JAN", generation: 843.06, irradiation: 4.47 },
  { month: "FEV", generation: 869.09, irradiation: 4.608 },
  { month: "MAR", generation: 795.16, irradiation: 4.216 },
  { month: "ABR", generation: 832.5, irradiation: 4.414 },
  { month: "MAI", generation: 744.23, irradiation: 3.946 },
  { month: "JUN", generation: 771.01, irradiation: 4.088 },
  { month: "JUL", generation: 804.02, irradiation: 4.265 },
  { month: "AGO", generation: 917.75, irradiation: 4.866 },
  { month: "SET", generation: 962.63, irradiation: 5.104 },
  { month: "OUT", generation: 962.82, irradiation: 5.105 },
  { month: "NOV", generation: 949.62, irradiation: 5.035 },
  { month: "DEZ", generation: 868.71, irradiation: 4.606 },
];

const immutableModelFields = new Set<keyof PreviewEditableData>([
  "responsibleName",
  "clientName",
  "clientCityUf",
  "clientPhone",
  "clientEmail",
  "investmentValue",
  "monthlySavings",
  "yearlySavings",
  "paybackYears",
  "consumptionKwh",
  "monthlyGenerationKwh",
]);

export default function PreviewPdfProposta() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [proposta, setProposta] = useState<PropostaDetalhe | null>(null);
  const [editable, setEditable] = useState<PreviewEditableData | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [servicesNote, setServicesNote] = useState(defaultServicesNote);
  const [acceptanceText, setAcceptanceText] = useState(defaultAcceptanceText);
  const [validityText, setValidityText] = useState(defaultValidityText);
  const [signatureClientName, setSignatureClientName] = useState("");
  const [moduleWarrantyProduct, setModuleWarrantyProduct] = useState("12 anos contra defeitos de fabricação");
  const [moduleWarrantyPerformance, setModuleWarrantyPerformance] = useState("25 anos");
  const [moduleWarrantyYear1, setModuleWarrantyYear1] = useState("97% da potência nominal no primeiro ano");
  const [moduleWarrantyYear25, setModuleWarrantyYear25] = useState("80% da potência nominal após 25 anos");
  const [installationWarranty, setInstallationWarranty] = useState("5 anos");
  const [installationWarrantyText, setInstallationWarrantyText] = useState("Cobertura de serviços de instalação, fixação e conexões elétricas");
  const [clarifications, setClarifications] = useState<string[]>([
    "* As estimativas de geração e economia foram baseadas no consumo apresentado e no estudo de irradiação local.",
    "** Os valores apresentados são estimativas e podem variar conforme fatores meteorológicos.",
    "*** O sistema foi projetado considerando o perfil de consumo atual do cliente.",
  ]);
  const [monthlyGenerationData, setMonthlyGenerationData] = useState<GenerationRow[]>(
    defaultMonthlyGenerationData.map((row) => ({ ...row })),
  );

  const currentSnapshot = useMemo(() => {
    if (!editable) return "";
    return JSON.stringify({
      editable,
      services,
      servicesNote,
      acceptanceText,
      validityText,
      signatureClientName,
      moduleWarrantyProduct,
      moduleWarrantyPerformance,
      moduleWarrantyYear1,
      moduleWarrantyYear25,
      installationWarranty,
      installationWarrantyText,
      clarifications,
      monthlyGenerationData,
    } as PreviewDraft);
  }, [
    editable,
    services,
    servicesNote,
    acceptanceText,
    validityText,
    signatureClientName,
    moduleWarrantyProduct,
    moduleWarrantyPerformance,
    moduleWarrantyYear1,
    moduleWarrantyYear25,
    installationWarranty,
    installationWarrantyText,
    clarifications,
    monthlyGenerationData,
  ]);

  const hasUnsavedChanges = Boolean(editable) && initialSnapshot !== "" && currentSnapshot !== initialSnapshot;

  useEffect(() => {
    async function carregar() {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await obterPropostaDetalhe(id);
        setProposta(data);
        const config = loadConfiguracoes();
        const hoje = new Date().toLocaleDateString("pt-BR");

        const baseEditable: PreviewEditableData = {
          companyName: "3S Engenharia",
          companyCnpj: "30.635.438/0001-07",
          proposalTitle: "Proposta Comercial Sistema Energia Solar",
          proposalDate: hoje,
          validityDays: "7",
          responsibleName: config.responsibleName || data.cliente.vendedor_nome,
          responsibleContact: config.responsibleContact || "",
          clientName: data.cliente.nome,
          clientCityUf: `${data.cliente.cidade}/${data.cliente.estado}`,
          clientPhone: data.cliente.telefone || "Não informado",
          clientEmail: data.cliente.email || "Não informado",
          investmentValue: formatarMoeda(data.dimensionamento.valor_total_sistema),
          monthlySavings: data.financeiro ? formatarMoeda(data.financeiro.economia_mensal_rs) : "",
          yearlySavings: data.financeiro ? formatarMoeda(data.financeiro.economia_anual_rs) : "",
          paybackYears: data.financeiro ? `${data.financeiro.payback_anos.toFixed(2)} anos` : "",
          consumptionKwh: String(data.cliente.consumo_kwh_mes ?? ""),
          monthlyGenerationKwh: data.financeiro ? String(data.financeiro.geracao_mensal_kwh) : "",
          moduleModel: "DMEGC",
          moduleManufacturer: "DMEGC610WP",
          modulePowerWp: "610",
          moduleWeightKg: "35",
          numberOfPanels: "",
          inverterModel1: "PHB 6000",
          inverterManufacturer1: "PHB",
          inverterPowerKw1: "6",
          inverterWarrantyYears1: "10",
          inverterModel2: "",
          inverterManufacturer2: "",
          inverterPowerKw2: "",
          inverterWarrantyYears2: "",
          generationWarning: defaultGenerationWarning,
          financialWarning: defaultFinancialWarning,
          contractTerms: defaultContractTerms,
          includedServices: defaultIncludedServices,
        };

        const baseDraft: PreviewDraft = {
          editable: baseEditable,
          services: defaultIncludedServices.split("\n"),
          servicesNote: defaultServicesNote,
          acceptanceText: defaultAcceptanceText,
          validityText: defaultValidityText,
          signatureClientName: data.cliente.nome,
          moduleWarrantyProduct: "12 anos contra defeitos de fabricação",
          moduleWarrantyPerformance: "25 anos",
          moduleWarrantyYear1: "97% da potência nominal no primeiro ano",
          moduleWarrantyYear25: "80% da potência nominal após 25 anos",
          installationWarranty: "5 anos",
          installationWarrantyText: "Cobertura de serviços de instalação, fixação e conexões elétricas",
          clarifications: [
            "* As estimativas de geração e economia foram baseadas no consumo apresentado e no estudo de irradiação local.",
            "** Os valores apresentados são estimativas e podem variar conforme fatores meteorológicos.",
            "*** O sistema foi projetado considerando o perfil de consumo atual do cliente.",
          ],
          monthlyGenerationData: defaultMonthlyGenerationData.map((row) => ({ ...row })),
        };

        let loadedDraft = baseDraft;
        try {
          const previewState = await obterPreviewPropostaState(data.dimensionamento.id);
          const parsed = previewState.data as unknown as PreviewDraft;
          loadedDraft = {
            ...loadedDraft,
            ...parsed,
            monthlyGenerationData:
              parsed?.monthlyGenerationData?.length
                ? parsed.monthlyGenerationData.map((row) => ({ ...row }))
                : loadedDraft.monthlyGenerationData,
          };
        } catch {
          // fallback para defaults em caso de indisponibilidade do endpoint
        }

        setEditable(loadedDraft.editable);
        setServices(loadedDraft.services);
        setServicesNote(loadedDraft.servicesNote);
        setAcceptanceText(loadedDraft.acceptanceText);
        setValidityText(loadedDraft.validityText);
        setSignatureClientName(loadedDraft.signatureClientName || loadedDraft.editable.clientName || "");
        setModuleWarrantyProduct(loadedDraft.moduleWarrantyProduct);
        setModuleWarrantyPerformance(loadedDraft.moduleWarrantyPerformance);
        setModuleWarrantyYear1(loadedDraft.moduleWarrantyYear1);
        setModuleWarrantyYear25(loadedDraft.moduleWarrantyYear25);
        setInstallationWarranty(loadedDraft.installationWarranty);
        setInstallationWarrantyText(loadedDraft.installationWarrantyText);
        setClarifications(loadedDraft.clarifications);
        setMonthlyGenerationData(loadedDraft.monthlyGenerationData);
        setInitialSnapshot(JSON.stringify(loadedDraft));
      } catch {
        toast.error("Não foi possível carregar a pré-visualização da proposta.");
      } finally {
        setIsLoading(false);
      }
    }
    carregar();
  }, [id]);

  const handleField = <K extends keyof PreviewEditableData>(field: K, value: PreviewEditableData[K]) => {
    if (immutableModelFields.has(field)) return;
    setEditable((current) => (current ? { ...current, [field]: value } : current));
  };

  const validadeFormatada = useMemo(() => {
    if (!editable?.proposalDate) return "";
    const [d, m, y] = editable.proposalDate.split("/").map(Number);
    if (!d || !m || !y) return editable.proposalDate;
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + (Number(editable.validityDays) || 7));
    return dt.toLocaleDateString("pt-BR");
  }, [editable?.proposalDate, editable?.validityDays]);

  const handleExportPdf = async () => {
    if (!proposta || !editable) return;
    setIsExportingPdf(true);
    try {
      const blob = await gerarPdfProposta({
        dimensionamento: proposta.dimensionamento.id,
        calculo_financeiro: proposta.financeiro?.id,
        company_name: editable.companyName,
        company_cnpj: editable.companyCnpj,
        proposal_title: editable.proposalTitle,
        proposal_date: editable.proposalDate,
        validity_days: Number(editable.validityDays) || 7,
        responsible_name: editable.responsibleName,
        responsible_contact: editable.responsibleContact,
        generation_warning: editable.generationWarning,
        contract_terms: `${editable.contractTerms}\n\n${acceptanceText}\n\nAssinatura do cliente: ${signatureClientName || editable.clientName}\n${validityText}`,
        included_services: services.join("\n"),
        texto_adicional: `OBS Serviços: ${servicesNote}`,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `proposta-${proposta.dimensionamento.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF gerado com sucesso.");
    } catch {
      toast.error("Não foi possível gerar o PDF da proposta.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleServiceChange = (index: number, value: string) => {
    const next = [...services];
    next[index] = value;
    setServices(next);
  };

  const addService = () => {
    setServices((prev) => [...prev, "Novo serviço"]);
  };

  const removeService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!id || !editable) return;
    setIsSavingDraft(true);
    try {
      const payload = JSON.parse(currentSnapshot) as PreviewDraft;
      await salvarPreviewPropostaState(id, payload as unknown as Record<string, unknown>);
      setInitialSnapshot(JSON.stringify(payload));
      toast.success("Alterações salvas com sucesso.");
    } catch {
      toast.error("Não foi possível salvar as alterações.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const addClarification = () => {
    setClarifications((prev) => [...prev, "**** Novo esclarecimento"]);
  };

  const removeClarification = (index: number) => {
    setClarifications((prev) => prev.filter((_, i) => i !== index));
  };

  if (isLoading || !editable) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">Carregando pré-visualização...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate(`/proposta/${id}`)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800"><ArrowLeft className="w-5 h-5" />Voltar para proposta</button>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="w-5 h-5" />
              {isSavingDraft ? "Salvando..." : "Salvar alterações"}
            </button>
          )}
          <button onClick={handleExportPdf} disabled={isExportingPdf} className="inline-flex items-center gap-2 bg-orange-500 text-white px-5 py-3 rounded-lg font-medium hover:bg-orange-600"><Download className="w-5 h-5" />{isExportingPdf ? "Gerando PDF..." : "Exportar PDF"}</button>
        </div>
      </div>
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        Campos em cinza são dados sincronizados da proposta e não podem ser editados no preview.
      </div>
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 space-y-6">
        <div className="text-right">
          <input value={editable.companyName} onChange={(e) => handleField("companyName", e.target.value)} className="text-right px-2 py-1 border border-gray-300 rounded text-lg font-semibold" />
          <div className="mt-2"><span className="text-sm mr-2">CNPJ:</span><input value={editable.companyCnpj} onChange={(e) => handleField("companyCnpj", e.target.value)} className="text-right px-2 py-1 border border-gray-300 rounded text-sm" /></div>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-4">
          <input value={editable.proposalTitle} onChange={(e) => handleField("proposalTitle", e.target.value)} className="w-full text-2xl font-bold text-white text-center bg-transparent border-b border-blue-400" />
          <input value={editable.clientName} readOnly className="w-full text-white text-center mt-2 bg-transparent border-b border-blue-400" />
        </div>
        <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
          <div><p className="text-xs">Data da Proposta</p><input value={editable.proposalDate} onChange={(e) => handleField("proposalDate", e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1" /></div>
          <div><p className="text-xs">Validade</p><p className="font-semibold">{validadeFormatada}</p></div>
          <div><p className="text-xs">Responsável</p><input value={editable.responsibleName} readOnly className="w-full border border-gray-300 rounded px-2 py-1 bg-gray-100" /></div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4 text-lg">Informações do Cliente</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-600 mb-2">Nome</p><input type="text" value={editable.clientName} readOnly className="w-full px-3 py-2 border border-gray-300 rounded font-medium bg-gray-100" /></div>
            <div><p className="text-sm text-gray-600 mb-2">Localização</p><input type="text" value={editable.clientCityUf} readOnly className="w-full px-3 py-2 border border-gray-300 rounded font-medium bg-gray-100" /></div>
            <div><p className="text-sm text-gray-600 mb-2">Telefone</p><input type="text" value={editable.clientPhone} readOnly className="w-full px-3 py-2 border border-gray-300 rounded font-medium bg-gray-100" /></div>
            <div><p className="text-sm text-gray-600 mb-2">Data</p><input type="text" value={editable.proposalDate} onChange={(e) => handleField("proposalDate", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded font-medium" /></div>
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4 text-center bg-blue-200 py-2 rounded">Dados dos Módulos Fotovoltaicos</h3>
          <table className="w-full border-collapse"><tbody>
            <tr className="border-b border-blue-300"><td className="py-2 px-4 font-semibold bg-blue-100 border-r border-blue-300">Modelo do Módulo</td><td className="py-2 px-4"><input type="text" value={editable.moduleModel} onChange={(e) => handleField("moduleModel", e.target.value)} className="w-full px-3 py-1 border border-blue-300 rounded" /></td></tr>
            <tr className="border-b border-blue-300"><td className="py-2 px-4 font-semibold bg-blue-100 border-r border-blue-300">Fabricante do Módulo (marca)</td><td className="py-2 px-4"><input type="text" value={editable.moduleManufacturer} onChange={(e) => handleField("moduleManufacturer", e.target.value)} className="w-full px-3 py-1 border border-blue-300 rounded" /></td></tr>
            <tr className="border-b border-blue-300"><td className="py-2 px-4 font-semibold bg-blue-100 border-r border-blue-300">Potência do Módulo (kWp)</td><td className="py-2 px-4"><input type="number" value={editable.modulePowerWp} onChange={(e) => handleField("modulePowerWp", e.target.value)} className="w-full px-3 py-1 border border-blue-300 rounded" /></td></tr>
            <tr className="border-b border-blue-300"><td className="py-2 px-4 font-semibold bg-blue-100 border-r border-blue-300">Quantidade de Módulos</td><td className="py-2 px-4"><input type="number" value={editable.numberOfPanels} onChange={(e) => handleField("numberOfPanels", e.target.value)} className="w-full px-3 py-1 border border-blue-300 rounded" /></td></tr>
            <tr><td className="py-2 px-4 font-semibold bg-blue-100 border-r border-blue-300">Peso do Módulo (kg)</td><td className="py-2 px-4"><input type="number" value={editable.moduleWeightKg} onChange={(e) => handleField("moduleWeightKg", e.target.value)} className="w-full px-3 py-1 border border-blue-300 rounded" /></td></tr>
          </tbody></table>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-4 text-center bg-green-200 py-2 rounded">
            Análise de Consumo e Geração
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
              <p className="text-sm text-gray-600 mb-2">Consumo Mensal do Cliente (kWh)</p>
              <input
                type="number"
                value={editable.consumptionKwh}
                readOnly
                className="w-full text-3xl font-bold text-blue-700 px-3 py-2 border border-blue-300 rounded bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-2">Média baseada na conta de energia</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-2 border-green-300">
              <p className="text-sm text-gray-600 mb-2">Geração Média Mensal Estimada* (kWh)</p>
              <input
                type="number"
                value={editable.monthlyGenerationKwh}
                readOnly
                className="w-full text-3xl font-bold text-green-700 px-3 py-2 border border-green-300 rounded bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-2">Produção estimada do sistema</p>
            </div>
          </div>
          <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
            <textarea
              value={editable.generationWarning}
              onChange={(e) => handleField("generationWarning", e.target.value)}
              rows={3}
              className="w-full text-xs text-yellow-900 px-2 py-1 border border-yellow-300 rounded"
            />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">Inversores</h3>
          <div className="mb-4">
            <div className="bg-green-100 border border-green-400 px-3 py-2 rounded-t-lg">
              <h4 className="font-semibold text-gray-800">Dados do Inversor - MODELO 1</h4>
            </div>
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                <tr className="bg-white"><td className="border border-gray-300 px-3 py-2 font-medium text-gray-700 w-1/3">Modelo</td><td className="border border-gray-300 px-3 py-2"><input type="text" value={editable.inverterModel1} onChange={(e) => handleField("inverterModel1", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" /></td></tr>
                <tr className="bg-gray-50"><td className="border border-gray-300 px-3 py-2 font-medium text-gray-700">Fabricante</td><td className="border border-gray-300 px-3 py-2"><input type="text" value={editable.inverterManufacturer1} onChange={(e) => handleField("inverterManufacturer1", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" /></td></tr>
                <tr className="bg-white"><td className="border border-gray-300 px-3 py-2 font-medium text-gray-700">Potência (kW)</td><td className="border border-gray-300 px-3 py-2"><input type="text" value={editable.inverterPowerKw1} onChange={(e) => handleField("inverterPowerKw1", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" /></td></tr>
                <tr className="bg-gray-50"><td className="border border-gray-300 px-3 py-2 font-medium text-gray-700">Garantia (anos)</td><td className="border border-gray-300 px-3 py-2"><input type="text" value={editable.inverterWarrantyYears1} onChange={(e) => handleField("inverterWarrantyYears1", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" /></td></tr>
              </tbody>
            </table>
          </div>

          {editable.inverterModel2 && (
            <div>
              <div className="bg-yellow-100 border border-yellow-400 px-3 py-2 rounded-t-lg">
                <h4 className="font-semibold text-gray-800">Dados do Inversor - MODELO 2</h4>
              </div>
              <table className="w-full border-collapse border border-gray-300">
                <tbody>
                  <tr className="bg-white"><td className="border border-gray-300 px-3 py-2 font-medium text-gray-700 w-1/3">Modelo</td><td className="border border-gray-300 px-3 py-2"><input type="text" value={editable.inverterModel2} onChange={(e) => handleField("inverterModel2", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" /></td></tr>
                  <tr className="bg-gray-50"><td className="border border-gray-300 px-3 py-2 font-medium text-gray-700">Fabricante</td><td className="border border-gray-300 px-3 py-2"><input type="text" value={editable.inverterManufacturer2} onChange={(e) => handleField("inverterManufacturer2", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" /></td></tr>
                  <tr className="bg-white"><td className="border border-gray-300 px-3 py-2 font-medium text-gray-700">Potência (kW)</td><td className="border border-gray-300 px-3 py-2"><input type="text" value={editable.inverterPowerKw2} onChange={(e) => handleField("inverterPowerKw2", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" /></td></tr>
                  <tr className="bg-gray-50"><td className="border border-gray-300 px-3 py-2 font-medium text-gray-700">Garantia (anos)</td><td className="border border-gray-300 px-3 py-2"><input type="text" value={editable.inverterWarrantyYears2} onChange={(e) => handleField("inverterWarrantyYears2", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" /></td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
          <div className="bg-indigo-600 text-white px-4 py-2 rounded-t-lg -mx-6 -mt-6 mb-4">
            <h3 className="font-semibold text-lg">Garantias dos Equipamentos</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Módulos Fotovoltaicos</h4>
              <div className="space-y-2">
                <input type="text" value={moduleWarrantyProduct} onChange={(e) => setModuleWarrantyProduct(e.target.value)} className="w-full px-2 py-1 border border-blue-300 rounded text-sm" />
                <input type="text" value={moduleWarrantyPerformance} onChange={(e) => setModuleWarrantyPerformance(e.target.value)} className="w-full px-2 py-1 border border-blue-300 rounded text-sm" />
                <input type="text" value={moduleWarrantyYear1} onChange={(e) => setModuleWarrantyYear1(e.target.value)} className="w-full px-2 py-1 border border-blue-300 rounded text-sm" />
                <input type="text" value={moduleWarrantyYear25} onChange={(e) => setModuleWarrantyYear25(e.target.value)} className="w-full px-2 py-1 border border-blue-300 rounded text-sm" />
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-3">Instalação e Mão de Obra</h4>
              <div className="space-y-2">
                <input type="text" value={installationWarranty} onChange={(e) => setInstallationWarranty(e.target.value)} className="w-full px-2 py-1 border border-orange-300 rounded text-sm" />
                <input type="text" value={installationWarrantyText} onChange={(e) => setInstallationWarrantyText(e.target.value)} className="w-full px-2 py-1 border border-orange-300 rounded text-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
          <div className="bg-gray-800 text-white px-4 py-2 rounded-t-lg -mx-6 -mt-6 mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-lg">Serviços Inclusos</h3>
            <button onClick={addService} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm">+ Adicionar</button>
          </div>
          <div className="space-y-2">
            {services.map((service, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="font-bold text-orange-600 min-w-[24px] mt-1">{index + 1}</span>
                <input type="text" value={service} onChange={(e) => handleServiceChange(index, e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-700" />
                <button onClick={() => removeService(index)} className="text-red-600 hover:text-red-800 px-2 py-2">✕</button>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-orange-100 border-l-4 border-orange-500 p-4 rounded">
            <div className="flex items-start gap-2"><strong className="text-orange-900 min-w-[40px]">OBS:</strong><textarea value={servicesNote} onChange={(e) => setServicesNote(e.target.value)} rows={2} className="flex-1 px-3 py-2 border border-orange-300 rounded text-orange-900 font-semibold" /></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-400 rounded-lg p-6">
          <h3 className="font-bold text-gray-800 text-right mb-4 text-lg">Cálculos do Dimensionamento</h3>
          <div className="bg-white rounded-lg overflow-hidden border-2 border-black">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white border-b-2 border-black"><th className="border-r-2 border-black px-4 py-2 text-sm font-bold text-gray-800">Mês</th><th className="border-r-2 border-black px-4 py-2 text-sm font-bold text-gray-800">Geração Mensal (kWh)</th><th className="px-4 py-2 text-sm font-bold text-gray-800">Irradiação 0° (kWh/m².dia)</th></tr>
              </thead>
              <tbody>
                {monthlyGenerationData.map((row, index) => (
                  <tr key={`${row.month}-${index}`} className="border-b-2 border-black">
                    <td className="border-r-2 border-black px-4 py-2"><input type="text" value={row.month} readOnly className="w-full text-center px-2 py-1 border border-gray-300 rounded bg-gray-100" /></td>
                    <td className="border-r-2 border-black px-4 py-2"><input type="number" step="0.01" value={row.generation} readOnly className="w-full text-center px-2 py-1 border border-gray-300 rounded bg-gray-100" /></td>
                    <td className="px-4 py-2"><input type="number" step="0.001" value={row.irradiation} readOnly className="w-full text-center px-2 py-1 border border-gray-300 rounded bg-gray-100" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <h3 className="font-semibold text-xl mb-4">Resumo Financeiro</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-orange-100 text-sm mb-2">Investimento Total (R$)</p><input type="text" value={editable.investmentValue} readOnly className="w-full text-2xl font-bold px-3 py-2 rounded text-gray-800 bg-gray-100" /></div>
            <div><p className="text-orange-100 text-sm mb-2">Economia Mensal Estimada* (R$)</p><input type="text" value={editable.monthlySavings} readOnly className="w-full text-2xl font-bold px-3 py-2 rounded text-gray-800 bg-gray-100" /></div>
            <div><p className="text-orange-100 text-sm mb-2">Economia Anual Estimada* (R$)</p><input type="text" value={editable.yearlySavings} readOnly className="w-full text-2xl font-bold px-3 py-2 rounded text-gray-800 bg-gray-100" /></div>
            <div><p className="text-orange-100 text-sm mb-2">Payback Estimado*</p><input type="text" value={editable.paybackYears} readOnly className="w-full text-2xl font-bold px-3 py-2 rounded text-gray-800 bg-gray-100" /></div>
          </div>
          <div className="mt-4 bg-orange-700 bg-opacity-50 rounded-lg p-3 border border-orange-400">
            <textarea value={editable.financialWarning} onChange={(e) => handleField("financialWarning", e.target.value)} rows={3} className="w-full text-xs text-white bg-transparent border border-orange-400 rounded px-2 py-1" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-800 rounded-lg overflow-hidden">
          <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-lg">Esclarecimento das Informações Apresentadas</h3>
            <button onClick={addClarification} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm">+ Adicionar esclarecimento</button>
          </div>
          <div className="p-6 space-y-3">
            {clarifications.map((clarification, index) => (
              <div key={index} className="flex items-center gap-3">
                <textarea
                  value={clarification}
                  onChange={(e) => {
                    const next = [...clarifications];
                    next[index] = e.target.value;
                    setClarifications(next);
                  }}
                  rows={Math.ceil(clarification.length / 120) || 1}
                  className="flex-1 text-xs text-gray-700 px-2 py-1 border border-gray-300 rounded"
                />
                <button onClick={() => removeClarification(index)} className="self-center text-red-600 hover:text-red-800 h-9 w-9 flex items-center justify-center">✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-lg p-8 mt-8">
          <h3 className="font-semibold text-lg mb-6 text-center text-gray-800">Aceite da Proposta</h3>
          <div className="max-w-2xl mx-auto">
            <textarea value={acceptanceText} onChange={(e) => setAcceptanceText(e.target.value)} rows={2} className="w-full text-sm text-gray-600 mb-6 text-center px-3 py-2 border border-gray-300 rounded" />
            <div className="mt-2 mb-6">
              <div className="border-b border-gray-500 h-10" />
              <p className="text-xs text-gray-600 mt-2 text-center">Assinatura do Cliente</p>
              <input
                type="text"
                value={signatureClientName}
                onChange={(e) => setSignatureClientName(e.target.value)}
                placeholder="Nome do cliente"
                className="w-full mt-2 text-sm text-gray-700 text-center px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2"><textarea value={validityText} onChange={(e) => setValidityText(e.target.value)} rows={1} className="flex-1 text-xs text-blue-800 text-center bg-transparent px-2 py-1 border border-blue-300 rounded" /><span className="text-xs text-blue-800">({editable.proposalDate})</span></div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="w-5 h-5" />
              {isSavingDraft ? "Salvando..." : "Salvar alterações"}
            </button>
          )}
          <button onClick={handleExportPdf} disabled={isExportingPdf} className="inline-flex items-center gap-2 bg-orange-500 text-white px-5 py-3 rounded-lg font-medium hover:bg-orange-600"><Download className="w-5 h-5" />{isExportingPdf ? "Gerando PDF..." : "Exportar PDF"}</button>
        </div>
      </div>
    </div>
  );
}
