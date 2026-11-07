import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const template = readFileSync(new URL("./home-page.component.html", import.meta.url), "utf8");

describe("HomePageComponent template", () => {
  it("contains the home carousel and product catalogue", () => {
    expect(template).toContain("Seleccionar diapositiva");
    expect(template).toContain("Marcas destacadas");
    expect(template).toContain("Catálogo");
    expect(template).toContain('aria-label="Buscar productos"');
  });
});
