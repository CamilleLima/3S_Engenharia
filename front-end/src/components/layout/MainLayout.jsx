import { Outlet } from "react-router-dom";

// TODO: importar Header e Footer após criá-los
// import Header from "./Header";
// import Footer from "./Footer";

// TODO: definir estrutura visual principal da aplicação (header + conteúdo + footer)

function MainLayout() {
  return (
    <div>
      {/* TODO: adicionar <Header /> */}

      <main>
        {/* Outlet renderiza a página filha da rota atual */}
        <Outlet />
      </main>

      {/* TODO: adicionar <Footer /> */}
    </div>
  );
}

export default MainLayout;
