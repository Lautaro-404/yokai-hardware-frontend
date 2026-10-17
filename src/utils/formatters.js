const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Formatea un monto numérico en Pesos Argentinos (ARS) usando Intl.NumberFormat("es-AR")
 */
export function formatARS(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return '$ 0';
  }
  return arsFormatter.format(Math.round(Number(amount)));
}

/**
 * Calcula el precio con descuento por transferencia bancaria (-10%)
 */
export function getTransferPrice(amount) {
  return Math.round(Number(amount || 0) * 0.9);
}

/**
 * Calcula el valor de la cuota sin interés / fija
 */
export function getInstallmentPrice(amount, installments = 6) {
  return Math.round(Number(amount || 0) / installments);
}

/**
 * Formatea una fecha ISO en formato local argentino (dd/mm/aaaa HH:mm)
 */
export function formatDateAR(isoString) {
  if (!isoString) return '-';
  try {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}
