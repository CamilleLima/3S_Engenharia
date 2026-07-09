import { useState, useEffect } from 'react';
import { Calculator, User, MapPin, Phone, Zap, Home, Package, Upload } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { brazilianStates, citiesByState } from 'C:/Users/Maria Luiza/Documents/solar_pro_test1/src/utils/brazilianLocations.ts';
import { formatPhone } from 'C:/Users/Maria Luiza/Documents/solar_pro_test1/src/utils/phoneMask.ts';
import { toast } from 'sonner';

interface FormData {
  clientName: string;
  city: string;
  state: string;
  phone: string;
  consumption: string;
  connectionType: 'monofasico' | 'bifasico' | 'trifasico';
  roofType: 'ceramico' | 'metalico' | 'solo';
}

export default function FormularioProposta() {
  const navigate = useNavigate();
  const { id: editingBudgetId } = useParams();
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    city: '',
    state: '',
    phone: '',
    consumption: '',
    connectionType: 'monofasico',
    roofType: 'ceramico',
  });

  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  // Estados para dados dos produtos
  const [moduleModel, setModuleModel] = useState('');
  const [moduleManufacturer, setModuleManufacturer] = useState('');
  const [modulePowerKw, setModulePowerKw] = useState('');
  const [moduleWeight, setModuleWeight] = useState('');
  
  const [inverterModel1, setInverterModel1] = useState('');
  const [inverterManufacturer1, setInverterManufacturer1] = useState('');
  const [inverterPowerKw1, setInverterPowerKw1] = useState('');
  const [inverterWarranty1, setInverterWarranty1] = useState('');
  
  const [inverterModel2, setInverterModel2] = useState('');
  const [inverterManufacturer2, setInverterManufacturer2] = useState('');
  const [inverterPowerKw2, setInverterPowerKw2] = useState('');
  const [inverterWarranty2, setInverterWarranty2] = useState('');

  // Carregar dados do orçamento para edição
  useEffect(() => {
    if (editingBudgetId) {
      const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
      const budget = budgets.find((b: any) => b.id === editingBudgetId);
      
      if (budget) {
        setIsEditMode(true);
        
        // Extrair cidade e estado do formato "Cidade, UF"
        const [city, state] = budget.city.split(', ');
        
        setFormData({
          clientName: budget.clientName,
          city: city || '',
          state: state || '',
          phone: budget.phone || '',
          consumption: budget.consumption.toString(),
          connectionType: budget.connectionType,
          roofType: budget.roofType,
        });
        
        // Carregar dados dos produtos
        setModuleModel(budget.moduleModel || '');
        setModuleManufacturer(budget.moduleManufacturer || '');
        setModulePowerKw(budget.modulePowerKw?.toString() || '');
        setModuleWeight(budget.moduleWeight?.toString() || '');
        
        setInverterModel1(budget.inverterModel1 || '');
        setInverterManufacturer1(budget.inverterManufacturer1 || '');
        setInverterPowerKw1(budget.inverterPowerKw1?.toString() || '');
        setInverterWarranty1(budget.inverterWarranty1?.toString() || '');
        
        setInverterModel2(budget.inverterModel2 || '');
        setInverterManufacturer2(budget.inverterManufacturer2 || '');
        setInverterPowerKw2(budget.inverterPowerKw2?.toString() || '');
        setInverterWarranty2(budget.inverterWarranty2?.toString() || '');
        
        // Carregar cidades do estado
        if (state) {
          setAvailableCities(citiesByState[state] || []);
        }
      }
    } else {
      // Carregar valores padrão das configurações quando criar novo orçamento
      const settings = JSON.parse(localStorage.getItem('settings') || '{}');
      setModuleModel(settings.moduleModel || 'DMEGC');
      setModuleManufacturer(settings.moduleManufacturer || 'DMEGC610WP');
      setModulePowerKw(settings.modulePowerKw?.toString() || '610');
      setModuleWeight(settings.moduleWeight?.toString() || '35');
      
      setInverterModel1(settings.inverterModel1 || 'PHB 6000');
      setInverterManufacturer1(settings.inverterManufacturer1 || 'PHP');
      setInverterPowerKw1(settings.inverterPowerKw1?.toString() || '6');
      setInverterWarranty1(settings.inverterWarranty1?.toString() || '10');
      
      setInverterModel2(settings.inverterModel2 || '');
      setInverterManufacturer2(settings.inverterManufacturer2 || '');
      setInverterPowerKw2(settings.inverterPowerKw2?.toString() || '');
      setInverterWarranty2(settings.inverterWarranty2?.toString() || '');
    }
  }, [editingBudgetId]);

  const handleStateChange = (selectedState: string) => {
    setFormData({ 
      ...formData, 
      state: selectedState,
      city: '' // Reset city when state changes
    });
    setAvailableCities(citiesByState[selectedState] || []);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const consumption = parseFloat(formData.consumption);

    // Obter configurações do sistema
    const settings = JSON.parse(localStorage.getItem('settings') || JSON.stringify({
      pricePerWatt: 4.5,
      installationCost: 2000,
      panelPower: 550,
      panelArea: 2.5,
      systemEfficiency: 80,
      solarIrradiation: 4.5
    }));

    // Calcular dimensionamento usando as configurações salvas
    const irradiation = settings.solarIrradiation;
    const systemEfficiency = settings.systemEfficiency / 100;
    const panelPower = settings.panelPower;
    const dailyGeneration = consumption / 30;
    const requiredPower = (dailyGeneration / (irradiation * systemEfficiency)) * 1000;
    const numberOfPanels = Math.ceil(requiredPower / panelPower);
    const systemPowerKwp = (numberOfPanels * panelPower) / 1000;

    // Calcular geração média mensal REAL do sistema
    // Fórmula: Potência do Sistema (kWp) × Irradiação Solar (horas/dia) × Dias do Mês × Eficiência do Sistema
    const monthlyGenerationEstimated = systemPowerKwp * irradiation * 30 * systemEfficiency;

    // Calcular valor total
    const totalValue = (systemPowerKwp * 1000 * settings.pricePerWatt) + settings.installationCost;

    const existingBudgets = JSON.parse(localStorage.getItem('budgets') || '[]');

    if (isEditMode && editingBudgetId) {
      // Modo de edição - Atualizar orçamento existente
      const updatedBudgets = existingBudgets.map((b: any) => {
        if (b.id === editingBudgetId) {
          return {
            ...b,
            clientName: formData.clientName,
            city: `${formData.city}, ${formData.state}`,
            power: systemPowerKwp,
            value: totalValue,
            consumption,
            connectionType: formData.connectionType,
            roofType: formData.roofType,
            phone: formData.phone,
            numberOfPanels,
            panelPower,
            monthlyGeneration: monthlyGenerationEstimated, // Geração real estimada
            moduleModel,
            moduleManufacturer,
            modulePowerKw,
            moduleWeight,
            inverterModel1,
            inverterManufacturer1,
            inverterPowerKw1,
            inverterWarranty1,
            inverterModel2,
            inverterManufacturer2,
            inverterPowerKw2,
            inverterWarranty2,
          };
        }
        return b;
      });
      
      localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
      navigate(`/documentos/${editingBudgetId}`);
      toast.success('Orçamento atualizado com sucesso!');
    } else {
      // Modo de criação - Criar novo orçamento
      const budgetId = Date.now().toString();
      
      const newBudget = {
        id: budgetId,
        clientName: formData.clientName,
        city: `${formData.city}, ${formData.state}`,
        power: systemPowerKwp,
        value: totalValue,
        date: new Date().toLocaleDateString('pt-BR'),
        status: 'pending' as const,
        consumption,
        connectionType: formData.connectionType,
        roofType: formData.roofType,
        phone: formData.phone,
        numberOfPanels,
        panelPower,
        monthlyGeneration: monthlyGenerationEstimated, // Geração real estimada
        moduleModel,
        moduleManufacturer,
        modulePowerKw,
        moduleWeight,
        inverterModel1,
        inverterManufacturer1,
        inverterPowerKw1,
        inverterWarranty1,
        inverterModel2,
        inverterManufacturer2,
        inverterPowerKw2,
        inverterWarranty2,
      };

      existingBudgets.push(newBudget);
      localStorage.setItem('budgets', JSON.stringify(existingBudgets));
      navigate(`/documentos/${budgetId}`);
      toast.success('Novo orçamento criado com sucesso!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Editar Orçamento' : 'Novo Orçamento'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isEditMode ? 'Modifique os dados da proposta' : 'Preencha os dados para gerar a proposta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Dados do Cliente */}
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
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Nome do cliente"
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
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                    disabled={!formData.state}
                  >
                    <option value="">
                      {formData.state ? 'Selecione a cidade' : 'Selecione o estado primeiro'}
                    </option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
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
                    onChange={handlePhoneChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dados Técnicos */}
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
                  onChange={(e) => setFormData({ ...formData, consumption: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, connectionType: e.target.value as any })}
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
                    onChange={(e) => setFormData({ ...formData, roofType: e.target.value as any })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                    required
                  >
                    <option value="ceramico">Cerâmico</option>
                    <option value="metalico">Metálico</option>
                    <option value="solo">Solo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Dados dos Produtos */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Dados dos Produtos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo do Módulo
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={moduleModel}
                    onChange={(e) => setModuleModel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: DMEGC"
                  />
                  <label 
                    title="Upload de imagem do módulo"
                    className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg px-4 cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-gray-600" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          toast.success(`Imagem ${file.name} selecionada!`);
                          // TODO: Implementar a lógica real de upload ou conversão em Base64
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fabricante do Módulo
                </label>
                <input
                  type="text"
                  value={moduleManufacturer}
                  onChange={(e) => setModuleManufacturer(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: DMEGC610WP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Potência do Módulo (kW)
                </label>
                <input
                  type="number"
                  value={modulePowerKw}
                  onChange={(e) => setModulePowerKw(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 610"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso do Módulo (kg)
                </label>
                <input
                  type="number"
                  value={moduleWeight}
                  onChange={(e) => setModuleWeight(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 35"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo do Inversor 1
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inverterModel1}
                    onChange={(e) => setInverterModel1(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: PHB 6000"
                  />
                  <label 
                    title="Upload de imagem do inversor 1"
                    className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg px-4 cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-gray-600" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          toast.success(`Imagem ${file.name} selecionada!`);
                          // TODO: Implementar a lógica real de upload ou conversão em Base64
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fabricante do Inversor 1
                </label>
                <input
                  type="text"
                  value={inverterManufacturer1}
                  onChange={(e) => setInverterManufacturer1(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: PHP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Potência do Inversor 1 (kW)
                </label>
                <input
                  type="number"
                  value={inverterPowerKw1}
                  onChange={(e) => setInverterPowerKw1(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 6"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Garantia do Inversor 1 (anos)
                </label>
                <input
                  type="number"
                  value={inverterWarranty1}
                  onChange={(e) => setInverterWarranty1(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 10"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo do Inversor 2
                </label>
                <input
                  type="text"
                  value={inverterModel2}
                  onChange={(e) => setInverterModel2(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: PHB 6000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fabricante do Inversor 2
                </label>
                <input
                  type="text"
                  value={inverterManufacturer2}
                  onChange={(e) => setInverterManufacturer2(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: PHP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Potência do Inversor 2 (kW)
                </label>
                <input
                  type="number"
                  value={inverterPowerKw2}
                  onChange={(e) => setInverterPowerKw2(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 6"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Garantia do Inversor 2 (anos)
                </label>
                <input
                  type="number"
                  value={inverterWarranty2}
                  onChange={(e) => setInverterWarranty2(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 10"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              <Calculator className="w-5 h-5" />
              {isEditMode ? 'Atualizar Proposta' : 'Gerar Proposta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}