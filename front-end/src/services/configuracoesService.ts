export interface ConfiguracoesGlobais {
  pricePerWatt: number;
  installationCost: number;
  energyRate: number;
  panelPower: number;
  panelArea: number;
  systemEfficiency: number;
  responsibleName: string;
  responsibleContact: string;
}

export const DEFAULT_CONFIGURACOES: ConfiguracoesGlobais = {
  pricePerWatt: 4.5,
  installationCost: 2000,
  energyRate: 0.95,
  panelPower: 550,
  panelArea: 2.5,
  systemEfficiency: 80,
  responsibleName: "",
  responsibleContact: "",
};

export function loadConfiguracoes(): ConfiguracoesGlobais {
  try {
    const saved = localStorage.getItem("settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_CONFIGURACOES, ...parsed };
    }
  } catch (_error) {
    /* ignore invalid local settings */
  }

  return { ...DEFAULT_CONFIGURACOES };
}

export function saveConfiguracoes(configuracoes: ConfiguracoesGlobais) {
  localStorage.setItem("settings", JSON.stringify(configuracoes));
}