export function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function formatarNumero(valor: number, casas = 2) {
  return Number(valor).toFixed(casas);
}

export function formatarData(data: Date | string) {
  const date = typeof data === "string" ? new Date(data) : data;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}
