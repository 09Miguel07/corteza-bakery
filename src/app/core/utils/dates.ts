/** Fecha local yyyy-MM-dd. toISOString() usaría UTC y en la noche de Colombia (UTC-5) daría el día siguiente. */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
