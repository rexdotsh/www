import type { CSSProperties } from "react";

// Drawn in order: the stem, its thorns and leaves, then the bud and sepals.
const STEM = [
  "M78 352C73 300 86 250 82 200 79 165 85 140 90 127",
  "M80.2 292C76 290 72.5 287 70 282 74 284.5 77.5 286 80.4 286",
  "M83.2 224C86.5 221 90 219 94.5 218 91 221 88 223.5 83.5 228.5",
  "M81.2 252C70 241 55 240 43 249 55 262 71 263 81.2 252Z",
  "M81.2 252C69 251 57 250 47 249.5",
  "M82.4 182C92 169 108 166 121 172 112 185 95 189 82.4 182Z",
  "M82.4 182C94 177 106 174 117 172.5",
];

const BUD = [
  "M90 127C89.4 124 88.4 121.5 87 119.5",
  "M88 118C74 114 66 100 68 84 69 72 76 62 86 54 88 50.5 90 47.5 91 44 100 52 110 66 111 82 112 100 104 113 92 118",
  "M70 96C80 92 86 84 89 72 91 64 96 58 103 57",
  "M76 69C81 71 85 68 87.5 62",
  "M103 57C106 55.5 108.5 55.8 110.5 57.5 108 58 106.5 59.5 106 62",
  "M88 119C79 117 71 111 66.5 103 65 100 63.5 97.5 61.5 96 66.5 97.5 71.5 101.5 76 106.5 80 110.5 84.5 113 89 113.5",
  "M92 119C101 116.5 108 110 112 101 113.5 97.5 115.5 94.5 118 93 116 98 114 104 109.5 109 105 113.5 99.5 115.5 93 116",
  "M88.5 121C82 125 75 126.5 68.5 123.5 74 123 80 121.5 87 119",
  "M92 121C98 125 105 126.5 111.5 122.5 106 122.5 100 121 93.5 119",
];

export default function RoseSprig({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`rose-sprig ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="40 40 84 316"
    >
      {[STEM, BUD].map((paths, group) => (
        <g className={group ? "sprig-bud" : "sprig-stem"} key={group}>
          {paths.map((d, index) => (
            <path
              d={d}
              key={d}
              pathLength="1"
              style={{ "--i": index } as CSSProperties}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
