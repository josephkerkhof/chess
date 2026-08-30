export function sqliteTimestampToIso(value: string) {
  return new Date(`${value.replace(" ", "T")}Z`).toISOString();
}
