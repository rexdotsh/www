export const DESIGNS = [
  { id: "classic", name: "classic", key: "0" },
  { id: "bloom", name: "bloom", key: "1" },
  { id: "editorial", name: "editorial", key: "2" },
  { id: "brutalist", name: "brutalist", key: "3" },
  { id: "museum", name: "museum", key: "4" },
  { id: "spec", name: "spec sheet", key: "5" },
  { id: "departures", name: "departures", key: "6" },
  { id: "broadsheet", name: "broadsheet", key: "7" },
  { id: "sentence", name: "one sentence", key: "8" },
] as const;

export type DesignId = (typeof DESIGNS)[number]["id"];

export function isDesignId(value: unknown): value is DesignId {
  return (
    typeof value === "string" && DESIGNS.some((design) => design.id === value)
  );
}
