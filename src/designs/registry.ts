export const DESIGNS = [
  { id: "classic", name: "classic", key: "0" },
  { id: "terminal", name: "terminal", key: "1" },
  { id: "editorial", name: "editorial", key: "2" },
  { id: "brutalist", name: "brutalist", key: "3" },
  { id: "ambient", name: "ambient", key: "4" },
  { id: "playful", name: "playful", key: "5" },
] as const;

export type DesignId = (typeof DESIGNS)[number]["id"];

export function isDesignId(value: unknown): value is DesignId {
  return (
    typeof value === "string" && DESIGNS.some((design) => design.id === value)
  );
}
