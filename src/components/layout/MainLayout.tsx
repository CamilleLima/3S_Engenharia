import { Outlet } from "react-router-dom";

import Footer from "./Footer.tsx";
import Header from "./Header.tsx";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
