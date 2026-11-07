import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const template = readFileSync(
  new URL("./product-list-page.component.html", import.meta.url),
  "utf8",
);

describe("ProductListPageComponent template", () => {
  it("renders the page header and product grid", () => {
    expect(template).toContain("<app-page-header");
    expect(template).toContain("<app-product-grid");
  });
});
