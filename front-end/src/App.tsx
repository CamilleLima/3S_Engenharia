import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import MainLayout from "./components/layout/MainLayout.tsx";
import Dashboard from "./pages/Dashboard/index.tsx";
import Documentos from "./pages/Documentos/index.tsx";
import Financeiro from "./pages/Financeiro/index.tsx";
import FormularioProposta from "./pages/FormularioProposta/index.tsx";
import PropostaDetalhes from "./pages/PropostaDetalhes/index.tsx";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="novo-orcamento" element={<FormularioProposta />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="proposta/:id" element={<PropostaDetalhes />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
