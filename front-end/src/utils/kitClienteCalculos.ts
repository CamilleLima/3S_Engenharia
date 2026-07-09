export const PERCENTUAL_ADICIONAL_KIT_CLIENTE = 0.05;
export const PERCENTUAL_ACRESCIMO_KIT_CLIENTE = 0.10;

export function calcularAdicionalKitCliente(valorKitCliente: number) {
  return valorKitCliente * PERCENTUAL_ADICIONAL_KIT_CLIENTE;
}

export function calcularAcrescimoKitCliente(valorKitCliente: number) {
  return valorKitCliente * PERCENTUAL_ACRESCIMO_KIT_CLIENTE;
}

export function calcularCustoAdicionaisKitCliente(valorKitCliente: number) {
  return (
    calcularAdicionalKitCliente(valorKitCliente) +
    calcularAcrescimoKitCliente(valorKitCliente)
  );
}

export function calcularValorTotalSistemaKitCliente(
  valorKitCliente: number,
  custoAdicionais: number,
  margemLucroDecimal: number
) {
  return valorKitCliente + custoAdicionais + valorKitCliente * margemLucroDecimal;
}
