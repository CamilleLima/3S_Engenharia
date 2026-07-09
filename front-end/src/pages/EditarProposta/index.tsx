import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Save, User, Zap } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { atualizarCliente } from "../../services/clientesService.ts";
import { recalcularDimensionamentoProposta } from "../../services/dimensionamentoService.ts";
import { obterPropostaDetalhe, type PropostaDetalhe } from "../../services/propostaService.ts";
import { formatarMoeda } from "../../utils/formatters.ts";
import { calcularCustoAdicionaisKitCliente } from "../../utils/kitClienteCalculos.ts";
import { formatPhone, unformatPhone } from "../../utils/phoneMask.ts";

interface EditarFormData {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
  numero: string;
  consumo_kwh_mes: string;
  latitude_cliente: string;
  longitude_cliente: string;
  valor_kit_cliente: string;
  tipo_ligacao: "monofasico" | "bifasico" | "trifasico";
  tipo_telhado: "ceramico" | "metalico" | "laje" | "fibrocimento";
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export default function EditarProposta() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [proposta, setProposta] = useState<PropostaDetalhe | null>(null);
  const [formData, setFormData] = useState<EditarFormData | null>(null);
  const lastFetchedCepRef = useRef<string>("");

  useEffect(() => {
    async function carregar() {
      if (!id) {
        return;
      }

      setIsLoading(true);
      try {
        const data = await obterPropostaDetalhe(id);
        const latitude = data.dimensionamento.latitude_cliente;
        const longitude = data.dimensionamento.longitude_cliente;

        setProposta(data);
        setFormData({
          nome: data.cliente.nome,
          cpf: formatCpf(data.cliente.cpf),
          telefone: formatPhone(data.cliente.telefone || ""),
          email: data.cliente.email || "",
          cep: data.cliente.cep,
          rua: data.cliente.rua,
          bairro: data.cliente.bairro,
          cidade: data.cliente.cidade,
          estado: data.cliente.estado,
          numero: data.cliente.numero,
          consumo_kwh_mes: String(data.cliente.consumo_kwh_mes),
          latitude_cliente:
            typeof latitude === "number" && Number.isFinite(latitude)
              ? String(latitude)
              : "",
          longitude_cliente:
            typeof longitude === "number" && Number.isFinite(longitude)
              ? String(longitude)
              : "",
          valor_kit_cliente: String(data.dimensionamento.custo_kit),
          tipo_ligacao: data.cliente.tipo_ligacao as EditarFormData["tipo_ligacao"],
          tipo_telhado: data.cliente.tipo_telhado as EditarFormData["tipo_telhado"],
        });
      } catch {
        toast.error("Não foi possível carregar os dados da proposta.");
      } finally {
        setIsLoading(false);
      }
    }

    carregar();
  }, [id]);

  const parcelasOrdenadas = useMemo(() => {
    if (!proposta) {
      return [] as Array<[string, number]>;
    }

    return Object.entries(proposta.dimensionamento.financiamento_parcelas)
      .map(([meses, valor]) => [meses, Number(valor)] as [string, number])
      .sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [proposta]);

  const updateField = <K extends keyof EditarFormData>(field: K, value: EditarFormData[K]) => {
    setFormData((current) => (current ? { ...current, [field]: value } : current));
  };

  const preencherEnderecoPorCep = async (cepValue: string) => {
    const cep = digitsOnly(cepValue).slice(0, 8);

    if (cep.length !== 8 || !formData) {
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
      setFormData((current) =>
        current
          ? {
              ...current,
              cep,
              rua: data.logradouro || current.rua,
              bairro: data.bairro || current.bairro,
              cidade: data.localidade || current.cidade,
              estado: data.uf || current.estado,
            }
          : current
      );
    } catch {
      toast.error("Não foi possível consultar o CEP no momento.");
    }
  };

  const handleCepChange = (value: string) => {
    const cep = digitsOnly(value).slice(0, 8);
    updateField("cep", cep);

    if (cep.length < 8) {
      lastFetchedCepRef.current = "";
      return;
    }

    preencherEnderecoPorCep(cep);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData || !proposta) {
      return;
    }

    const consumo = Number(formData.consumo_kwh_mes);
    const latitude = Number(formData.latitude_cliente);
    const longitude = Number(formData.longitude_cliente);
    const valorKitCliente = Number(formData.valor_kit_cliente);

    if (
      !formData.nome.trim() ||
      digitsOnly(formData.cpf).length !== 11 ||
      !Number.isFinite(consumo) ||
      consumo <= 0 ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180 ||
      !Number.isFinite(valorKitCliente) ||
      valorKitCliente <= 0
    ) {
      toast.error("Preencha corretamente os campos obrigatórios.");
      return;
    }

    setIsSaving(true);
    try {
      await atualizarCliente(proposta.cliente.id, {
        nome: formData.nome.trim(),
        cpf: digitsOnly(formData.cpf),
        telefone: unformatPhone(formData.telefone),
        email: formData.email.trim(),
        cep: digitsOnly(formData.cep).slice(0, 8),
        rua: formData.rua.trim(),
        bairro: formData.bairro.trim(),
        cidade: formData.cidade.trim(),
        estado: formData.estado.trim().toUpperCase(),
        numero: formData.numero.trim(),
        consumo_kwh_mes: consumo,
        tipo_ligacao: formData.tipo_ligacao,
        tipo_telhado: formData.tipo_telhado,
      });

      await recalcularDimensionamentoProposta(proposta.dimensionamento.id, {
        latitude_cliente: latitude,
        longitude_cliente: longitude,
        custo_kit: valorKitCliente,
        custo_adicionais: calcularCustoAdicionaisKitCliente(valorKitCliente),
      });

      toast.success("Proposta atualizada com sucesso.");
      navigate(`/proposta/${id}`);
    } catch {
      toast.error("Não foi possível salvar as alterações da proposta.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-gray-500">
          Carregando proposta...
        </div>
      </div>
    );
  }

  if (!proposta || !formData) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/proposta/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para proposta
        </button>

        <h1 className="text-3xl font-bold text-gray-800">Editar Proposta</h1>
        <p className="text-gray-600 mt-1">Atualize os dados do cliente e técnicos usados no cadastro.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-800">Dados do Cliente</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => updateField("nome", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CPF *</label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => updateField("cpf", formatCpf(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => updateField("telefone", formatPhone(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CEP *</label>
              <input
                type="text"
                value={formData.cep}
                onBlur={() => preencherEnderecoPorCep(formData.cep)}
                onChange={(e) => handleCepChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                maxLength={8}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Número *</label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => updateField("numero", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rua *</label>
              <input
                type="text"
                value={formData.rua}
                onChange={(e) => updateField("rua", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bairro *</label>
              <input
                type="text"
                value={formData.bairro}
                onChange={(e) => updateField("bairro", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => updateField("cidade", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado (UF) *</label>
              <input
                type="text"
                maxLength={2}
                value={formData.estado}
                onChange={(e) => updateField("estado", e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
              Vendedor responsável: <strong>{proposta.cliente.vendedor_nome}</strong> ({proposta.cliente.vendedor_cargo})
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-800">Dados de Dimensionamento</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Consumo Médio Mensal (kWh) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.consumo_kwh_mes}
                onChange={(e) => updateField("consumo_kwh_mes", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude do Cliente *</label>
              <input
                type="number"
                min="-90"
                max="90"
                step="0.000001"
                value={formData.latitude_cliente}
                onChange={(e) => updateField("latitude_cliente", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude do Cliente *</label>
              <input
                type="number"
                min="-180"
                max="180"
                step="0.000001"
                value={formData.longitude_cliente}
                onChange={(e) => updateField("longitude_cliente", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor do Kit do Cliente *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.valor_kit_cliente}
                onChange={(e) => updateField("valor_kit_cliente", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: 12200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Ligação *</label>
              <select
                value={formData.tipo_ligacao}
                onChange={(e) => updateField("tipo_ligacao", e.target.value as EditarFormData["tipo_ligacao"])}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="monofasico">Monofásico</option>
                <option value="bifasico">Bifásico</option>
                <option value="trifasico">Trifásico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Telhado *</label>
              <select
                value={formData.tipo_telhado}
                onChange={(e) => updateField("tipo_telhado", e.target.value as EditarFormData["tipo_telhado"])}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="ceramico">Cerâmico</option>
                <option value="metalico">Metálico</option>
                <option value="laje">Laje</option>
                <option value="fibrocimento">Fibrocimento</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
              Irradiação, fator de perda e potência final são calculados automaticamente no backend.
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Potência calculada</p>
              <p className="text-lg font-semibold text-gray-800 mt-1">
                {proposta.dimensionamento.potencia_calculada_kwp.toFixed(2)} kWp
              </p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Valor do sistema</p>
              <p className="text-lg font-semibold text-gray-800 mt-1">
                {formatarMoeda(proposta.dimensionamento.valor_total_sistema)}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Parcelamento</p>
            <div className="space-y-1">
              {parcelasOrdenadas.map(([meses, valor]) => (
                <p key={meses} className="text-sm text-gray-600">
                  {meses}x de <strong>{formatarMoeda(valor)}</strong>
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(`/proposta/${id}`)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:bg-orange-300"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
