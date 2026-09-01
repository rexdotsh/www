export const DESIGNS = [
  { id: "classic", name: "classic", key: "0" },
  { id: "bloom", name: "bloom", key: "1" },
  { id: "sentence", name: "one sentence", key: "2" },
  { id: "duet", name: "duet", key: "3" },
] as const;

export type DesignId = (typeof DESIGNS)[number]["id"];

export function isDesignId(value: unknown): value is DesignId {
  return (
    typeof value === "string" && DESIGNS.some((design) => design.id === value)
  );
}
