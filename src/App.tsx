import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import MainLayout from "./components/layout/MainLayout.tsx";
import FormularioProposta from "./pages/FormularioProposta/index.tsx";
import { Dashboard } from "./pages/DashBoard/index.tsx";
import { Settings } from "./pages/Configuracoes/index.tsx";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="novo-orcamento" element={<FormularioProposta />} />
            <Route path="editar-orcamento/:id" element={<FormularioProposta />} />
            <Route path="configuracoes" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
