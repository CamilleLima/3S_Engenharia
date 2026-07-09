import { useEffect, useState } from "react";
import {
  DollarSign,
  Save,
  Settings as SettingsIcon,
  Sun,
  User,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_CONFIGURACOES,
  loadConfiguracoes,
  saveConfiguracoes,
  type ConfiguracoesGlobais,
} from "../../services/configuracoesService";

export default function Configuracoes() {
  const [pricePerWatt, setPricePerWatt] = useState(
    DEFAULT_CONFIGURACOES.pricePerWatt.toString()
  );
  const [installationCost, setInstallationCost] = useState(
    DEFAULT_CONFIGURACOES.installationCost.toString()
  );
  const [energyRate, setEnergyRate] = useState(
    DEFAULT_CONFIGURACOES.energyRate.toString()
  );
  const [panelPower, setPanelPower] = useState(
    DEFAULT_CONFIGURACOES.panelPower.toString()
  );
  const [panelArea, setPanelArea] = useState(
    DEFAULT_CONFIGURACOES.panelArea.toString()
  );
  const [systemEfficiency, setSystemEfficiency] = useState(
    DEFAULT_CONFIGURACOES.systemEfficiency.toString()
  );
  const [responsibleName, setResponsibleName] = useState("");
  const [responsibleContact, setResponsibleContact] = useState("");

  useEffect(() => {
    const config = loadConfiguracoes();
    setPricePerWatt(config.pricePerWatt.toString());
    setInstallationCost(config.installationCost.toString());
    setEnergyRate(config.energyRate.toString());
    setPanelPower(config.panelPower.toString());
    setPanelArea(config.panelArea.toString());
    setSystemEfficiency(config.systemEfficiency.toString());
    setResponsibleName(config.responsibleName);
    setResponsibleContact(config.responsibleContact);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const settings: ConfiguracoesGlobais = {
      pricePerWatt: parseFloat(pricePerWatt),
      installationCost: parseFloat(installationCost),
      energyRate: parseFloat(energyRate),
      panelPower: parseFloat(panelPower),
      panelArea: parseFloat(panelArea),
      systemEfficiency: parseFloat(systemEfficiency),
      responsibleName,
      responsibleContact,
    };

    saveConfiguracoes(settings);
    toast.success("Configurações salvas com sucesso!");
  };

  const parsedPricePerWatt = parseFloat(pricePerWatt) || 0;
  const parsedInstallationCost = parseFloat(installationCost) || 0;
  const parsedPanelPower = parseFloat(panelPower) || 1;
  const parsedPanelArea = parseFloat(panelArea) || 0;

  const examplePanels = Math.ceil(5000 / parsedPanelPower);
  const exampleArea = (examplePanels * parsedPanelArea).toFixed(1);
  const exampleEquip = (5000 * parsedPricePerWatt).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  });
  const exampleTotal = (
    5000 * parsedPricePerWatt +
    parsedInstallationCost
  ).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  const exampleInstall = parsedInstallationCost.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-800">Configurações</h2>
          </div>
          <p className="text-gray-600 mt-1">
            Gerencie os preços e parâmetros do sistema
          </p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-8">
          {/* Precificação */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">Precificação</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço do Kit por Watt (R$/Wp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    R$
                  </span>
                  <input
                    type="number"
                    value={pricePerWatt}
                    onChange={(e) => setPricePerWatt(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="4.5"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Preço médio por watt pico instalado (inclui painéis, inversor,
                  estrutura)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custo de Instalação / Mão de Obra (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    R$
                  </span>
                  <input
                    type="number"
                    value={installationCost}
                    onChange={(e) => setInstallationCost(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="2000"
                    step="100"
                    min="0"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Valor fixo para instalação e serviços
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarifa de Energia (R$/kWh)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    R$
                  </span>
                  <input
                    type="number"
                    value={energyRate}
                    onChange={(e) => setEnergyRate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.95"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Valor médio do kWh na sua região (usado para cálculo de
                  economia)
                </p>
              </div>
            </div>
          </div>

          {/* Parâmetros do Sistema Solar */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-gray-800">
                Parâmetros do Sistema Solar
              </h3>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4 text-sm text-yellow-800">
              💡 A <strong>irradiação solar</strong> é determinada automaticamente pela
              localização (lat/lon) de cada cliente, consultando a estação de referência
              mais próxima. Não é necessário configurá-la globalmente.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Potência do Painel (W)
                </label>
                <input
                  type="number"
                  value={panelPower}
                  onChange={(e) => setPanelPower(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="550"
                  step="10"
                  min="0"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Potência nominal do painel solar padrão
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área por Painel (m²)
                </label>
                <input
                  type="number"
                  value={panelArea}
                  onChange={(e) => setPanelArea(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="2.5"
                  step="0.1"
                  min="0"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Área ocupada por cada painel
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eficiência do Sistema (%)
                </label>
                <input
                  type="number"
                  value={systemEfficiency}
                  onChange={(e) => setSystemEfficiency(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="80"
                  step="1"
                  min="0"
                  max="100"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Eficiência considerando perdas do sistema
                </p>
              </div>


            </div>
          </div>

          {/* Resumo das Configurações */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">
                Resumo das Configurações
              </h3>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-blue-800 mb-4">
                Configurações atuais do sistema:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Painel Solar Padrão:</span>
                  <span className="font-medium text-gray-800">
                    {panelPower}W Monocristalino
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Área por Painel:</span>
                  <span className="font-medium text-gray-800">
                    {panelArea} m²
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Eficiência do Sistema:</span>
                  <span className="font-medium text-gray-800">
                    {systemEfficiency}%
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* Exemplo de Cálculo */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h4 className="font-medium text-gray-800 mb-3">
              Exemplo de Cálculo
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Sistema de 5 kWp:</strong>
              </p>
              <p>
                • Equipamentos: 5.000W × R$ {pricePerWatt} = R$ {exampleEquip}
              </p>
              <p>• Instalação: R$ {exampleInstall}</p>
              <p className="font-medium pt-2 border-t border-gray-300">
                <strong>Total: R$ {exampleTotal}</strong>
              </p>
              <p className="mt-3 text-gray-600">
                • Número de painéis: {examplePanels} painéis de {panelPower}W
              </p>
              <p className="text-gray-600">
                • Área necessária: {exampleArea} m²
              </p>
            </div>
          </div>

          {/* Dados do Responsável */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-800">
                Dados do Responsável pela Proposta
              </h3>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-4">
                Estas informações aparecerão no PDF final da proposta
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Responsável
                  </label>
                  <input
                    type="text"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: João da Silva"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Nome de quem está criando a proposta
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contato do Responsável
                  </label>
                  <input
                    type="text"
                    value={responsibleContact}
                    onChange={(e) => setResponsibleContact(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: (11) 98765-4321 ou joao@email.com"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Telefone, e-mail ou WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              <Save className="w-5 h-5" />
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
