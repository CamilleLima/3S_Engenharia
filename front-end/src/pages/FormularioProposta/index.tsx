import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calculator,
  Home,
  MapPin,
  Phone,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  criarCliente,
  criarVendedor,
  listarVendedores,
  type CriarClientePayload,
  type Vendedor,
} from "../../services/clientesService.ts";
import {
  brazilianStates,
  citiesByState,
} from "../../utils/brazilianLocations.ts";
import { formatPhone, unformatPhone } from "../../utils/phoneMask.ts";

type ConnectionType = "monofasico" | "bifasico" | "trifasico";
type RoofType = "ceramico" | "metalico" | "laje" | "fibrocimento";
type SellerMode = "existing" | "new";

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

export default function FormularioProposta() {
  const [formData, setFormData] = useState<ClientFormData>(initialClientForm);
  const [sellerData, setSellerData] = useState<SellerFormData>(initialSellerForm);
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

  const canSubmit = useMemo(() => {
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
    setFormData(initialClientForm);
    setSellerData(initialSellerForm);
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

      await criarCliente(buildPayload(sellerId));
      toast.success("Novo orçamento criado com sucesso!");
      resetForm();
    } catch (error: any) {
      const detail = error?.response?.data;

      if (detail?.detail) {
        toast.error(detail.detail);
      } else if (typeof detail === "object" && detail !== null) {
        const firstMessage = Object.values(detail).flat()[0];
        toast.error(String(firstMessage));
      } else {
        toast.error("Falha ao salvar os dados da proposta.");
      }
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
            Preencha os dados para gerar a proposta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
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
                <p className="text-sm text-gray-500 mt-1">
                  Encontre este valor na conta de luz do cliente
                </p>
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
                    onChange={(e) => updateForm("roofType", e.target.value as RoofType)}
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

          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Limpar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
            >
              <Calculator className="w-5 h-5" />
              {isSubmitting ? "Salvando..." : "Gerar Proposta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
