import { useState } from "react";

export function useFetch<TData, TArgs extends unknown[]>(
  fetchFn: (...args: TArgs) => Promise<TData>
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function execute(...args: TArgs) {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(...args);
      setData(result);
      return result;
    } catch (err: any) {
      const message = err?.message || "Erro na requisição";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, execute };
}
