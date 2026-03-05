import { createContext, useContext, useState } from "react";

// TODO: definir a estrutura do estado global da proposta após reunião de equipe
// Sugestão: armazenar dados do formulário, resultados de dimensionamento e financeiro
// para compartilhar entre as páginas do fluxo de criação de proposta

const PropostaContext = createContext(null);

export function PropostaProvider({ children }) {
  // TODO: definir o estado inicial conforme campos acordados em reunião
  const [proposta, setProposta] = useState({
    // TODO: adicionar campos
  });

  // TODO: implementar funções de atualização do estado
  // Exemplo:
  // function atualizarDadosCliente(dados) { ... }
  // function atualizarDimensionamento(resultado) { ... }
  // function atualizarFinanceiro(resultado) { ... }
  // function resetar() { ... }

  const value = {
    proposta,
    setProposta,
    // TODO: expor as funções acima no value
  };

  return (
    <PropostaContext.Provider value={value}>
      {children}
    </PropostaContext.Provider>
  );
}

// Hook de acesso ao context
export function usePropostaContext() {
  const context = useContext(PropostaContext);
  if (!context) {
    throw new Error("usePropostaContext deve ser usado dentro de <PropostaProvider>");
  }
  return context;
}
