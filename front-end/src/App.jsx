import { BrowserRouter, Route, Routes } from "react-router-dom";

// TODO: importar páginas após criá-las
// import FormularioProposta from "./pages/FormularioProposta";
// import Dimensionamento from "./pages/Dimensionamento";
// import Financeiro from "./pages/Financeiro";
// import Documentos from "./pages/Documentos";

// TODO: importar layout principal após criá-lo
// import MainLayout from "./components/layout/MainLayout";

// TODO: definir estrutura de rotas da aplicação
// Sugestão de fluxo: FormularioProposta → Dimensionamento → Financeiro → Documentos

function App() {
  return (
    <BrowserRouter>
      {/* TODO: envolver rotas com MainLayout após implementá-lo */}
      <Routes>
        {/* TODO: definir e registrar todas as rotas */}
        {/* Exemplo:
        <Route path="/" element={<MainLayout />}>
          <Route index element={<FormularioProposta />} />
          <Route path="dimensionamento" element={<Dimensionamento />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="documentos" element={<Documentos />} />
        </Route>
        */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
