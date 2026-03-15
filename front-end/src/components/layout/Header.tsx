import { Sun } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Sun className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">3S Engenharia</span>
            </div>

            <nav className="hidden md:flex gap-1">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-orange-100 text-orange-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/novo-orcamento"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-orange-100 text-orange-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                Novo Orçamento
              </NavLink>
              <NavLink
                to="/financeiro"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-orange-100 text-orange-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                Financeiro
              </NavLink>
              <NavLink
                to="/documentos"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-orange-100 text-orange-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                Documentos
              </NavLink>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
