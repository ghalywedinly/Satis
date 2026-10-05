/** ISO timestamp `days` days before now. Server-side, per request. */
export const daysAgoIso = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
