import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calculator,
  CircleDollarSign,
  Download,
  FileText,
  Home,
  MapPin,
  Phone,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  criarVendedor,
  listarVendedores,
  type CriarClientePayload,
  type Vendedor,
} from "../../services/clientesService.ts";
import {
  criarOrcamentoEmEtapas,
  type OrcamentoEtapasResposta,
} from "../../services/dimensionamentoService.ts";
import {
  calcularFinanceiro,
  type FinanceiroResposta,
} from "../../services/financeiroService.ts";
import {
  brazilianStates,
  citiesByState,
} from "../../utils/brazilianLocations.ts";
import { formatarMoeda } from "../../utils/formatters.ts";
import { formatPhone, unformatPhone } from "../../utils/phoneMask.ts";

type ConnectionType = "monofasico" | "bifasico" | "trifasico";
type RoofType = "ceramico" | "metalico" | "laje" | "fibrocimento";
type SellerMode = "existing" | "new";
type Step = 1 | 2;

interface ClientFormData {
  clientName: string;
  cpf: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  cep: string;
  street: string;
  district: string;
  number: string;
  consumption: string;
  connectionType: ConnectionType;
  roofType: RoofType;
}

interface SellerFormData {
  nome: string;
  cargo: string;
  telefone: string;
  email: string;
}

interface DimensionamentoFormData {
  latitudeCliente: string;
  longitudeCliente: string;
  custoKit: string;
  custoAdicionais: string;
  margemLucroDecimal: string;
  impostoServicoDecimal: string;
  taxaJurosMensalDecimal: string;
}

interface FinanceiroFormData {
  tarifaEnergiaKwh: string;
  custoDisponibilidadeRs: string;
}

const initialClientForm: ClientFormData = {
  clientName: "",
  cpf: "",
  city: "",
  state: "",
  phone: "",
  email: "",
  cep: "",
  street: "",
  district: "",
  number: "",
  consumption: "",
  connectionType: "monofasico",
  roofType: "ceramico",
};

const initialSellerForm: SellerFormData = {
  nome: "",
  cargo: "",
  telefone: "",
  email: "",
};

const initialDimensionamentoForm: DimensionamentoFormData = {
  latitudeCliente: "",
  longitudeCliente: "",
  custoKit: "",
  custoAdicionais: "",
  margemLucroDecimal: "",
  impostoServicoDecimal: "",
  taxaJurosMensalDecimal: "",
};

const initialFinanceiroForm: FinanceiroFormData = {
  tarifaEnergiaKwh: "0.95",
  custoDisponibilidadeRs: "50",
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeCep(value: string) {
  return digitsOnly(value).slice(0, 8);
}

function formatCpf(value: string) {
  const digits = digitsOnly(value).slice(0, 11);

  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractFirstErrorMessage(detail: unknown): string | null {
  if (!detail) {
    return null;
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    for (const item of detail) {
      const msg = extractFirstErrorMessage(item);
      if (msg) {
        return msg;
      }
    }
    return null;
  }

  if (typeof detail === "object") {
    for (const value of Object.values(detail as Record<string, unknown>)) {
      const msg = extractFirstErrorMessage(value);
      if (msg) {
        return msg;
      }
    }
  }

  return null;
}

export default function FormularioProposta() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [ultimoOrcamento, setUltimoOrcamento] =
    useState<OrcamentoEtapasResposta | null>(null);
  const [ultimoFinanceiro, setUltimoFinanceiro] =
    useState<FinanceiroResposta | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(initialClientForm);
  const [sellerData, setSellerData] = useState<SellerFormData>(initialSellerForm);
  const [dimensionamentoData, setDimensionamentoData] = useState<DimensionamentoFormData>(
    initialDimensionamentoForm
  );
  const [financeiroData, setFinanceiroData] = useState<FinanceiroFormData>(
    initialFinanceiroForm
  );
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [sellerMode, setSellerMode] = useState<SellerMode>("existing");
  const [sellers, setSellers] = useState<Vendedor[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSellers, setIsLoadingSellers] = useState(true);
  const lastFetchedCepRef = useRef<string>("");

  const hasExistingSellers = sellers.length > 0;

  useEffect(() => {
    async function loadSellers() {
      try {
        const data = await listarVendedores({ ativo: "true" });
        setSellers(data);

        if (data.length > 0) {
          setSelectedSellerId(String(data[0].id));
          setSellerMode("existing");
        } else {
          setSellerMode("new");
        }
      } catch {
        toast.error("Não foi possível carregar os vendedores.");
        setSellerMode("new");
      } finally {
        setIsLoadingSellers(false);
      }
    }

    loadSellers();
  }, []);

  useEffect(() => {
    const stateCities = citiesByState[formData.state] || [];

    if (formData.city && !stateCities.includes(formData.city)) {
      setAvailableCities([...stateCities, formData.city]);
      return;
    }

    setAvailableCities(stateCities);
  }, [formData.city, formData.state]);

  const canResolveSeller = useMemo(() => {
    if (sellerMode === "existing") {
      return Boolean(selectedSellerId);
    }

    return Boolean(
      sellerData.nome &&
        sellerData.cargo &&
        digitsOnly(sellerData.telefone).length >= 10 &&
        sellerData.email
    );
  }, [selectedSellerId, sellerData, sellerMode]);

  const canProceedStep1 = useMemo(
    () =>
      Boolean(
        formData.clientName &&
          digitsOnly(formData.cpf).length === 11 &&
          formData.state &&
          formData.city &&
          normalizeCep(formData.cep).length === 8 &&
          formData.street &&
          formData.district &&
          formData.number &&
          canResolveSeller
      ),
    [canResolveSeller, formData]
  );

  const canSubmit = useMemo(
    () =>
      Boolean(
        canProceedStep1 &&
          Number(formData.consumption) > 0 &&
          Number(financeiroData.tarifaEnergiaKwh) > 0 &&
          dimensionamentoData.latitudeCliente &&
          dimensionamentoData.longitudeCliente
      ),
    [
      canProceedStep1,
      dimensionamentoData.latitudeCliente,
      dimensionamentoData.longitudeCliente,
      financeiroData.tarifaEnergiaKwh,
      formData.consumption,
    ]
  );

  const updateForm = <K extends keyof ClientFormData>(
    field: K,
    value: ClientFormData[K]
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const updateSeller = <K extends keyof SellerFormData>(
    field: K,
    value: SellerFormData[K]
  ) => {
    setSellerData((current) => ({ ...current, [field]: value }));
  };

  const updateDimensionamento = <K extends keyof DimensionamentoFormData>(
    field: K,
    value: DimensionamentoFormData[K]
  ) => {
    setDimensionamentoData((current) => ({ ...current, [field]: value }));
  };

  const updateFinanceiro = <K extends keyof FinanceiroFormData>(
    field: K,
    value: FinanceiroFormData[K]
  ) => {
    setFinanceiroData((current) => ({ ...current, [field]: value }));
  };

  const handleStateChange = (selectedState: string) => {
    setFormData((current) => ({
      ...current,
      state: selectedState,
      city: "",
    }));
  };

  const handlePhoneChange = (value: string) => {
    updateForm("phone", formatPhone(value));
  };

  const handleSellerPhoneChange = (value: string) => {
    updateSeller("telefone", formatPhone(value));
  };

  const handleCpfChange = (value: string) => {
    updateForm("cpf", formatCpf(value));
  };

  const preencherEnderecoPorCep = async (cepValue: string) => {
    const cep = normalizeCep(cepValue);

    if (cep.length !== 8) {
      return;
    }

    if (lastFetchedCepRef.current === cep) {
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        lastFetchedCepRef.current = "";
        toast.error("CEP não encontrado.");
        return;
      }

      lastFetchedCepRef.current = cep;

      setFormData((current) => ({
        ...current,
        cep,
        street: data.logradouro || current.street,
        district: data.bairro || current.district,
        city: data.localidade || current.city,
        state: data.uf || current.state,
      }));
    } catch {
      toast.error("Não foi possível consultar o CEP no momento.");
    }
  };

  const handleCepChange = (value: string) => {
    const cep = normalizeCep(value);
    updateForm("cep", cep);

    if (cep.length < 8) {
      lastFetchedCepRef.current = "";
      return;
    }

    preencherEnderecoPorCep(cep);
  };

  const handleCepBlur = async () => {
    await preencherEnderecoPorCep(formData.cep);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData(initialClientForm);
    setSellerData(initialSellerForm);
    setDimensionamentoData(initialDimensionamentoForm);
    setFinanceiroData(initialFinanceiroForm);
    if (hasExistingSellers) {
      setSellerMode("existing");
      setSelectedSellerId(String(sellers[0].id));
    } else {
      setSellerMode("new");
      setSelectedSellerId("");
    }
  };

  const buildPayload = (sellerId: number): CriarClientePayload => ({
    nome: formData.clientName,
    cpf: digitsOnly(formData.cpf),
    telefone: unformatPhone(formData.phone),
    email: formData.email,
    cep: normalizeCep(formData.cep),
    rua: formData.street,
    bairro: formData.district,
    cidade: formData.city,
    estado: formData.state,
    numero: formData.number,
    consumo_kwh_mes: Number(formData.consumption),
    tipo_ligacao: formData.connectionType,
    tipo_telhado: formData.roofType,
    vendedor: sellerId,
  });

  const buildDimensionamentoPayload = () => ({
    uf: formData.state,
    latitude_cliente: Number(dimensionamentoData.latitudeCliente),
    longitude_cliente: Number(dimensionamentoData.longitudeCliente),
    custo_kit: parseOptionalNumber(dimensionamentoData.custoKit),
    custo_adicionais: parseOptionalNumber(dimensionamentoData.custoAdicionais),
    margem_lucro_decimal: parseOptionalNumber(dimensionamentoData.margemLucroDecimal),
    imposto_servico_decimal: parseOptionalNumber(
      dimensionamentoData.impostoServicoDecimal
    ),
    taxa_juros_mensal_decimal: parseOptionalNumber(
      dimensionamentoData.taxaJurosMensalDecimal
    ),
  });

  const buildFinanceiroPayload = (dimensionamentoId: number) => ({
    dimensionamento: dimensionamentoId,
    tarifa_energia_kwh: Number(financeiroData.tarifaEnergiaKwh),
    custo_disponibilidade_rs:
      parseOptionalNumber(financeiroData.custoDisponibilidadeRs) ?? 50,
  });

  const goToStep2 = () => {
    if (!canProceedStep1) {
      toast.error("Preencha os dados obrigatórios da etapa 1.");
      return;
    }

    setCurrentStep(2);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentStep === 1) {
      goToStep2();
      return;
    }

    setIsSubmitting(true);

    try {
      let sellerId = Number(selectedSellerId);

      if (sellerMode === "new") {
        const createdSeller = await criarVendedor({
          nome: sellerData.nome,
          cargo: sellerData.cargo,
          telefone: unformatPhone(sellerData.telefone),
          email: sellerData.email,
        });

        setSellers((current) => [createdSeller, ...current]);
        sellerId = createdSeller.id;
        setSelectedSellerId(String(createdSeller.id));
      }

      const response = await criarOrcamentoEmEtapas({
        cliente: buildPayload(sellerId),
        dimensionamento: buildDimensionamentoPayload(),
      });

      const financeiro = await calcularFinanceiro(
        buildFinanceiroPayload(response.dimensionamento.id)
      );

      setUltimoOrcamento(response);
      setUltimoFinanceiro(financeiro);

      const total = response?.dimensionamento?.valor_total_sistema;
      const paybackAnos = Number(financeiro.payback_anos);
      toast.success(
        total
          ? `Proposta gerada! Total: R$ ${Number(total).toFixed(2)} • Payback: ${paybackAnos.toFixed(2)} anos`
          : "Proposta gerada com sucesso!"
      );
      resetForm();
    } catch (error: any) {
      const detail = error?.response?.data;
      const message = extractFirstErrorMessage(detail);
      toast.error(message || "Falha ao salvar os dados da proposta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Novo Orçamento</h2>
          <p className="text-gray-600 mt-1">
            Fluxo em etapas: cliente/vendedor e dados técnicos
          </p>
          <div className="mt-4 flex gap-2">
            <span
              className={`px-3 py-1 text-xs rounded-full ${
                currentStep === 1
                  ? "bg-orange-100 text-orange-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              1. Cliente e vendedor
            </span>
            <span
              className={`px-3 py-1 text-xs rounded-full ${
                currentStep === 2
                  ? "bg-orange-100 text-orange-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              2. Dimensionamento técnico
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {currentStep === 1 ? (
            <>
              <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Dados do Cliente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => updateForm("clientName", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Nome do cliente"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF *
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Selecione o estado</option>
                  {brazilianStates.map((state) => (
                    <option key={state.uf} value={state.uf}>
                      {state.name} ({state.uf})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                    disabled={!formData.state}
                  >
                    <option value="">
                      {formData.state ? "Selecione a cidade" : "Selecione o estado primeiro"}
                    </option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP *
                </label>
                <input
                  type="text"
                  value={formData.cep}
                  onBlur={handleCepBlur}
                  onChange={(e) => handleCepChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="69900-000"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="cliente@exemplo.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rua *
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => updateForm("street", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Rua / Logradouro"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => updateForm("district", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Bairro"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número da Residência *
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => updateForm("number", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 123"
                  required
                />
              </div>
            </div>
          </div>
              <div>
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Dados do Vendedor</h3>
            </div>

            <div className="flex flex-wrap gap-6 mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  value="existing"
                  checked={sellerMode === "existing"}
                  onChange={() => setSellerMode("existing")}
                  disabled={!hasExistingSellers || isLoadingSellers}
                />
                Selecionar vendedor existente
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  value="new"
                  checked={sellerMode === "new"}
                  onChange={() => setSellerMode("new")}
                />
                Cadastrar novo vendedor
              </label>
            </div>

            {sellerMode === "existing" && hasExistingSellers ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendedor *
                </label>
                <select
                  value={selectedSellerId}
                  onChange={(e) => setSelectedSellerId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  {sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.nome} — {seller.cargo}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Vendedor *
                  </label>
                  <input
                    type="text"
                    value={sellerData.nome}
                    onChange={(e) => updateSeller("nome", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Nome completo"
                    required={sellerMode === "new"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo *
                  </label>
                  <input
                    type="text"
                    value={sellerData.cargo}
                    onChange={(e) => updateSeller("cargo", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: Vendedor"
                    required={sellerMode === "new"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={sellerData.telefone}
                      onChange={(e) => handleSellerPhoneChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      required={sellerMode === "new"}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={sellerData.email}
                    onChange={(e) => updateSeller("email", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="vendedor@empresa.com"
                    required={sellerMode === "new"}
                  />
                </div>
              </div>
            )}
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-800">Dados Técnicos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consumo Médio Mensal (kWh) *
                  </label>
                  <input
                    type="number"
                    value={formData.consumption}
                    onChange={(e) => updateForm("consumption", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: 500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Ligação *
                  </label>
                  <select
                    value={formData.connectionType}
                    onChange={(e) =>
                      updateForm("connectionType", e.target.value as ConnectionType)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="monofasico">Monofásico</option>
                    <option value="bifasico">Bifásico</option>
                    <option value="trifasico">Trifásico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Telhado *
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.roofType}
                      onChange={(e) =>
                        updateForm("roofType", e.target.value as RoofType)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                      required
                    >
                      <option value="ceramico">Cerâmico</option>
                      <option value="metalico">Metálico</option>
                      <option value="laje">Laje</option>
                      <option value="fibrocimento">Fibrocimento</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude do Cliente *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={dimensionamentoData.latitudeCliente}
                    onChange={(e) =>
                      updateDimensionamento("latitudeCliente", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: -9.98"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude do Cliente *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={dimensionamentoData.longitudeCliente}
                    onChange={(e) =>
                      updateDimensionamento("longitudeCliente", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: -67.82"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custo do Kit (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={dimensionamentoData.custoKit}
                    onChange={(e) => updateDimensionamento("custoKit", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: 12200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custos Adicionais (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={dimensionamentoData.custoAdicionais}
                    onChange={(e) =>
                      updateDimensionamento("custoAdicionais", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: 2000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Margem Lucro (decimal, opcional)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={dimensionamentoData.margemLucroDecimal}
                    onChange={(e) =>
                      updateDimensionamento("margemLucroDecimal", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: 0.35"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imposto Serviço (decimal, opcional)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={dimensionamentoData.impostoServicoDecimal}
                    onChange={(e) =>
                      updateDimensionamento("impostoServicoDecimal", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: 0.07"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxa Juros Mensal (decimal, opcional)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={dimensionamentoData.taxaJurosMensalDecimal}
                    onChange={(e) =>
                      updateDimensionamento("taxaJurosMensalDecimal", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: 0.009"
                  />
                </div>

                <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold text-gray-800">
                      Parâmetros Financeiros (RF3)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tarifa de Energia (R$/kWh) *
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        value={financeiroData.tarifaEnergiaKwh}
                        onChange={(e) =>
                          updateFinanceiro("tarifaEnergiaKwh", e.target.value)
                        }
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
                        value={financeiroData.custoDisponibilidadeRs}
                        onChange={(e) =>
                          updateFinanceiro("custoDisponibilidadeRs", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Ex: 50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Limpar
            </button>
            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
            )}

            {currentStep === 1 ? (
              <button
                type="submit"
                disabled={!canProceedStep1}
                className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
              >
                Próxima etapa
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
            >
              <Calculator className="w-5 h-5" />
              {isSubmitting ? "Salvando..." : "Gerar Proposta"}
            </button>
            )}
          </div>
        </form>
      </div>

      {ultimoOrcamento && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Resumo do Orçamento Gerado</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(`/proposta/${ultimoOrcamento.dimensionamento.id}`)
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
                    `/documentos?dimensionamento=${ultimoOrcamento.dimensionamento.id}${
                      ultimoFinanceiro ? `&financeiro=${ultimoFinanceiro.id}` : ""
                    }`
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
              <p className="text-xs text-gray-500">Potência estimada</p>
              <p className="text-lg font-semibold text-gray-800">
                {ultimoOrcamento.dimensionamento.potencia_calculada_kwp} kWp
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500">Valor total</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatarMoeda(ultimoOrcamento.dimensionamento.valor_total_sistema)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500">Lucro líquido</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatarMoeda(ultimoOrcamento.dimensionamento.lucro_liquido_empresa)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Referência geográfica</p>
              <p className="text-sm text-gray-600">
                UF: <strong>{ultimoOrcamento.geo.uf}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Estação: <strong>{ultimoOrcamento.geo.estacao_mais_proxima.id}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Distância: {ultimoOrcamento.geo.estacao_mais_proxima.distancia_km} km
              </p>
            </div>

            <div className="p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Parcelas (Tabela Price)</p>
              <div className="space-y-1">
                {Object.entries(ultimoOrcamento.dimensionamento.financiamento_parcelas)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .map(([meses, valor]) => (
                    <p key={meses} className="text-sm text-gray-600">
                      {meses}x de <strong>{formatarMoeda(valor)}</strong>
                    </p>
                  ))}
              </div>
            </div>
          </div>

          {ultimoFinanceiro && (
            <>
              <div className="mt-6 flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-orange-500" />
                <h4 className="text-base font-semibold text-gray-800">
                  Retorno Financeiro (RF3)
                </h4>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500">Investimento total</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {formatarMoeda(Number(ultimoFinanceiro.investimento_total_rs))}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500">Economia mensal estimada</p>
                  <p className="text-lg font-semibold text-green-700">
                    {formatarMoeda(Number(ultimoFinanceiro.economia_mensal_rs))}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500">Payback</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {Number(ultimoFinanceiro.payback_anos).toFixed(2)} anos
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Economia anual: {" "}
                    <strong>
                      {formatarMoeda(Number(ultimoFinanceiro.economia_anual_rs))}
                    </strong>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Geração média mensal: {" "}
                    <strong>
                      {Number(ultimoFinanceiro.geracao_mensal_kwh).toFixed(2)} kWh
                    </strong>
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Economia estimada em 25 anos: {" "}
                    <strong>
                      {formatarMoeda(Number(ultimoFinanceiro.economia_25_anos_rs))}
                    </strong>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Payback em meses: {" "}
                    <strong>{Number(ultimoFinanceiro.payback_meses).toFixed(2)}</strong>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
