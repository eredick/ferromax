import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const template = readFileSync(new URL("./page-header.component.html", import.meta.url), "utf8");

describe("PageHeaderComponent template", () => {
  it("renders the eyebrow and page title", () => {
    expect(template).toContain("{{ eyebrow() }}");
    expect(template).toContain("{{ title() }}");
  });
});
