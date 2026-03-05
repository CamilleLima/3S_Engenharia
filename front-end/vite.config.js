import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// TODO: ajustar configurações conforme necessidade do projeto
// Documentação: https://vitejs.dev/config/

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // TODO: configurar proxy para o back-end Django se necessário
    // proxy: {
    //   "/api": "http://localhost:8000",
    // },
  },
});
