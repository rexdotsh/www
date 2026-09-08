import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseActivity, parseRepositories } from "./github";

describe("public GitHub data", () => {
  it("keeps only well-formed repository statistics", () => {
    assert.deepEqual(
      parseRepositories([
        {
          name: "kleis",
          stargazers_count: 7,
          pushed_at: "2026-09-06T12:00:00Z",
          private: false,
        },
        {
          name: "broken",
          stargazers_count: -1,
          pushed_at: "2026-09-06T12:00:00Z",
        },
        {
          name: "private",
          stargazers_count: 1,
          pushed_at: "2026-09-06T12:00:00Z",
          private: true,
        },
        { name: "undated", stargazers_count: 2, pushed_at: "not-a-date" },
        null,
      ]),
      [{ name: "kleis", stars: 7, updated: "2026-09-06T12:00:00Z" }]
    );
    assert.deepEqual(parseRepositories({ message: "rate limited" }), []);
  });

  it("rejects private, unsupported, and malformed events", () => {
    const event = {
      id: "1",
      type: "PushEvent",
      public: true,
      created_at: "2026-09-06T12:00:00Z",
      repo: { name: "rexdotsh/kleis" },
    };
    assert.deepEqual(
      parseActivity([
        event,
        { ...event, id: "2", public: false },
        { ...event, id: "3", type: "__proto__" },
        { ...event, id: "4", repo: { name: "https://other.example" } },
        { ...event, id: "5", created_at: null },
        null,
      ]),
      [
        {
          id: "1",
          action: "pushed to",
          date: event.created_at,
          repository: "rexdotsh/kleis",
          url: "https://github.com/rexdotsh/kleis",
        },
      ]
    );
  });

  it("bounds the feed and constructs links from repository names", () => {
    const events = Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      type: "ReleaseEvent",
      public: true,
      created_at: "2026-09-06T12:00:00Z",
      repo: { name: "floraorg/sakura", url: "https://unrelated.example" },
    }));
    const parsed = parseActivity(events);
    assert.equal(parsed.length, 5);
    assert.equal(parsed[0].url, "https://github.com/floraorg/sakura");
    assert.deepEqual(parseActivity(null), []);
  });
});
