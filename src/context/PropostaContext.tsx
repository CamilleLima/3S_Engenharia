import { createContext, useContext, useState, type ReactNode } from "react";

interface PropostaState {
  [key: string]: unknown;
}

interface PropostaContextValue {
  proposta: PropostaState;
  setProposta: React.Dispatch<React.SetStateAction<PropostaState>>;
}

const PropostaContext = createContext<PropostaContextValue | null>(null);

export function PropostaProvider({ children }: { children: ReactNode }) {
  const [proposta, setProposta] = useState<PropostaState>({});

  const value: PropostaContextValue = {
    proposta,
    setProposta,
  };

  return (
    <PropostaContext.Provider value={value}>{children}</PropostaContext.Provider>
  );
}

export function usePropostaContext() {
  const context = useContext(PropostaContext);
  if (!context) {
    throw new Error("usePropostaContext deve ser usado dentro de <PropostaProvider>");
  }
  return context;
}
