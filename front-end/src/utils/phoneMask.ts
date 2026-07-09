export function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "");
  const limited = numbers.substring(0, 11);

  if (limited.length <= 2) {
    return limited;
  }

  if (limited.length <= 6) {
    return `(${limited.substring(0, 2)}) ${limited.substring(2)}`;
  }

  if (limited.length <= 10) {
    return `(${limited.substring(0, 2)}) ${limited.substring(2, 6)}-${limited.substring(6)}`;
  }

  return `(${limited.substring(0, 2)}) ${limited.substring(2, 7)}-${limited.substring(7)}`;
}

export function unformatPhone(value: string): string {
  return value.replace(/\D/g, "");
}
