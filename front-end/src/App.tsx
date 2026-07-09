import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import MainLayout from "./components/layout/MainLayout.tsx";
import Dashboard from "./pages/Dashboard/index.tsx";
import EditarProposta from "./pages/EditarProposta/index.tsx";
import Configuracoes from "./pages/Configuracoes/index.tsx";
import FormularioProposta from "./pages/FormularioProposta/index.tsx";
import PreviewPdfProposta from "./pages/PreviewPdfProposta/index.tsx";
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
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="proposta/:id" element={<PropostaDetalhes />} />
            <Route path="proposta/:id/editar" element={<EditarProposta />} />
            <Route path="proposta/:id/preview-pdf" element={<PreviewPdfProposta />} />
            <Route path="financeiro" element={<Navigate to="/dashboard" replace />} />
            <Route path="documentos" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
