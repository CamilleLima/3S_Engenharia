import axios from "axios";

// TODO: definir a URL base da API Django conforme ambiente (dev/prod)
// Sugestão: usar variável de ambiente VITE_API_BASE_URL

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  // TODO: adicionar headers padrão, timeout e interceptors conforme necessidade
  // timeout: 10000,
  // headers: { "Content-Type": "application/json" },
});

// TODO: configurar interceptor de request (ex: adicionar token de autenticação)
// api.interceptors.request.use((config) => {
//   // TODO: implementar
//   return config;
// });

// TODO: configurar interceptor de response (ex: tratamento global de erros 401/500)
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // TODO: implementar
//     return Promise.reject(error);
//   }
// );

export default api;
