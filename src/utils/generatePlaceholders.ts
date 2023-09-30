export function generatePlaceholders(count: number) {
  const placeholders = [];
  for (let i = 0; i < count; i++) {
    placeholders.push("?");
  }
  return placeholders.join(", ");
}
