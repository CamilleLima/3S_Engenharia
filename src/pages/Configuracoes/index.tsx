import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, DollarSign, Wrench, Save, Sun, User } from 'lucide-react';
import { toast } from 'sonner';

export function Settings() {
  const [pricePerWatt, setPricePerWatt] = useState('4.5');
  const [installationCost, setInstallationCost] = useState('2000');
  const [energyRate, setEnergyRate] = useState('0.95');
  
  // Novos estados para configurações do sistema solar
  const [panelPower, setPanelPower] = useState('550');
  const [panelArea, setPanelArea] = useState('2.5');
  const [systemEfficiency, setSystemEfficiency] = useState('80');
  const [solarIrradiation, setSolarIrradiation] = useState('4.5');

  // Estados para dados da empresa/responsável
  const [responsibleName, setResponsibleName] = useState('');
  const [responsibleContact, setResponsibleContact] = useState('');

  useEffect(() => {
    // Carregar configurações do localStorage
    const saved = localStorage.getItem('settings');
    if (saved) {
      const settings = JSON.parse(saved);
      setPricePerWatt(settings.pricePerWatt.toString());
      setInstallationCost(settings.installationCost.toString());
      setEnergyRate(settings.energyRate?.toString() || '0.95');
      
      // Carregar configurações do sistema solar
      setPanelPower(settings.panelPower?.toString() || '550');
      setPanelArea(settings.panelArea?.toString() || '2.5');
      setSystemEfficiency(settings.systemEfficiency?.toString() || '80');
      setSolarIrradiation(settings.solarIrradiation?.toString() || '4.5');
      
      // Carregar dados da empresa/responsável
      setResponsibleName(settings.responsibleName || 'Thales Campos');
      setResponsibleContact(settings.responsibleContact || '68 9973 3807');
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Manter os dados de produtos existentes no settings para usar como padrão
    const currentSettings = JSON.parse(localStorage.getItem('settings') || '{}');
    
    const settings = {
      pricePerWatt: parseFloat(pricePerWatt),
      installationCost: parseFloat(installationCost),
      energyRate: parseFloat(energyRate),
      panelPower: parseFloat(panelPower),
      panelArea: parseFloat(panelArea),
      systemEfficiency: parseFloat(systemEfficiency),
      solarIrradiation: parseFloat(solarIrradiation),
      // Manter valores de produtos existentes
      moduleModel: currentSettings.moduleModel || 'DMEGC',
      moduleManufacturer: currentSettings.moduleManufacturer || 'DMEGC610WP',
      modulePowerKw: currentSettings.modulePowerKw || 610,
      moduleWeight: currentSettings.moduleWeight || 35,
      inverterModel1: currentSettings.inverterModel1 || 'PHB 6000',
      inverterManufacturer1: currentSettings.inverterManufacturer1 || 'PHP',
      inverterPowerKw1: currentSettings.inverterPowerKw1 || 6,
      inverterWarranty1: currentSettings.inverterWarranty1 || 10,
      inverterModel2: currentSettings.inverterModel2 || '',
      inverterManufacturer2: currentSettings.inverterManufacturer2 || '',
      inverterPowerKw2: currentSettings.inverterPowerKw2 || 0,
      inverterWarranty2: currentSettings.inverterWarranty2 || 0,
      responsibleName,
      responsibleContact,
    };

    localStorage.setItem('settings', JSON.stringify(settings));
    toast.success('Configurações salvas com sucesso!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-800">Configurações</h2>
          </div>
          <p className="text-gray-600 mt-1">Gerencie os preços e parâmetros do sistema</p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-8">
          {/* Preços */}
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
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
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
                  Preço médio por watt pico instalado (inclui painéis, inversor, estrutura)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custo de Instalação / Mão de Obra (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
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
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
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
                  Valor médio do kWh na sua região (usado para cálculo de economia)
                </p>
              </div>
            </div>
          </div>

          {/* Parâmetros do Sistema Solar */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-gray-800">Parâmetros do Sistema Solar</h3>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Irradiação Solar (kWh/m²/dia)
                </label>
                <input
                  type="number"
                  value={solarIrradiation}
                  onChange={(e) => setSolarIrradiation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="4.5"
                  step="0.1"
                  min="0"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Irradiação solar média da sua região
                </p>
              </div>
            </div>
          </div>

          {/* Resumo técnico */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Resumo das Configurações</h3>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-blue-800 mb-4">
                Configurações atuais do sistema:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Painel Solar Padrão:</span>
                  <span className="font-medium text-gray-800">{panelPower}W Monocristalino</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Área por Painel:</span>
                  <span className="font-medium text-gray-800">{panelArea} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Eficiência do Sistema:</span>
                  <span className="font-medium text-gray-800">{systemEfficiency}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Irradiação Solar Média:</span>
                  <span className="font-medium text-gray-800">{solarIrradiation} kWh/m²/dia</span>
                </div>
              </div>
            </div>
          </div>

          {/* Exemplos de Cálculo */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h4 className="font-medium text-gray-800 mb-3">Exemplo de Cálculo</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Sistema de 5 kWp:</strong>
              </p>
              <p>
                • Equipamentos: 5.000W × R$ {pricePerWatt} = R$ {(5000 * parseFloat(pricePerWatt)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p>
                • Instalação: R$ {parseFloat(installationCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="font-medium pt-2 border-t border-gray-300">
                <strong>Total: R$ {((5000 * parseFloat(pricePerWatt)) + parseFloat(installationCost)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </p>
              <p className="mt-3 text-gray-600">
                • Número de painéis: {Math.ceil(5000 / parseFloat(panelPower))} painéis de {panelPower}W
              </p>
              <p className="text-gray-600">
                • Área necessária: {(Math.ceil(5000 / parseFloat(panelPower)) * parseFloat(panelArea)).toFixed(1)} m²
              </p>
            </div>
          </div>

          {/* Dados do Responsável pela Proposta */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-800">Dados do Responsável pela Proposta</h3>
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

          {/* Botões */}
          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
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