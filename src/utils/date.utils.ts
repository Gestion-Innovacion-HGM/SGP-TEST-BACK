import { DAY_ALERT_EXPIRATION } from '@utils/constant.utils';

/**
 * Checks if a given date is within the alert range from the current date.
 *
 * @param targetDate - The date to check against the current date.
 * @returns `true` if the target date is within the alert range, `false` otherwise.
 *
 */
export function isDateWithinAlertRange(targetDate: Date): boolean {
  const currentDate = new Date();

  const differenceInTime = targetDate.getTime() - currentDate.getTime();
  const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

  return differenceInDays <= DAY_ALERT_EXPIRATION;
}

export function generateExpirationMessage(
  expirationDate: Date,
  documentName: string,
): string {
  if (!expirationDate) {
    return `No hay fecha de expiración para el documento '${documentName}'.`;
  }

  const currentDate = new Date();
  const timeDifference = expirationDate.getTime() - currentDate.getTime();
  const daysToExpiration = Math.ceil(timeDifference / (1000 * 3600 * 24));

  if (timeDifference < 0) {
    // Caso 2: Ya pasó la fecha de vencimiento
    return `El documento '${documentName}' ya venció hace ${Math.abs(daysToExpiration)} días.`;
  } else if (daysToExpiration <= DAY_ALERT_EXPIRATION) {
    // Caso 1: Próximo a vencer
    return `Advertencia: El documento '${documentName}' vence en los próximos ${DAY_ALERT_EXPIRATION} días o menos.`;
  } else {
    // Caso 3: No vencido y fuera del rango de alerta
    return `El documento '${documentName}' vencerá en ${daysToExpiration} días.`;
  }
}
