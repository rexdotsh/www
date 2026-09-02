const paperTheme = (
  name: string,
  colors: {
    body: string;
    comment: string;
    constant: string;
    entity: string;
    keyword: string;
    string: string;
  }
) => ({
  name,
  type: "light" as const,
  settings: [
    { settings: { foreground: colors.body } },
    {
      scope: ["keyword", "storage", "keyword.control", "keyword.operator"],
      settings: { foreground: colors.keyword },
    },
    {
      scope: ["string", "punctuation.definition.string"],
      settings: { foreground: colors.string },
    },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: colors.comment, fontStyle: "italic" },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.character"],
      settings: { foreground: colors.constant },
    },
    {
      scope: ["entity.name.function", "support.function", "entity.name.type"],
      settings: { foreground: colors.entity },
    },
  ],
});

export const PAPER = paperTheme("paper", {
  body: "#2b2620",
  comment: "#a29a89",
  constant: "#8f1236",
  entity: "#17140f",
  keyword: "#b3123a",
  string: "#7d6840",
});

export const PAPER_DARK = paperTheme("paper-dark", {
  body: "#cfcdc9",
  comment: "#75716a",
  constant: "#ef7d99",
  entity: "#e8e6e3",
  keyword: "#e5476d",
  string: "#c9a769",
});
