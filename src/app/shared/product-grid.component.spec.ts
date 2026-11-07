import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const template = readFileSync(new URL("./product-grid.component.html", import.meta.url), "utf8");

describe("ProductGridComponent template", () => {
  it("renders product cards and the empty state", () => {
    expect(template).toContain("Agregar");
    expect(template).toContain("No hay productos disponibles");
  });
});
