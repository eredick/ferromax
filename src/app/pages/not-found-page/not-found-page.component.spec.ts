import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const template = readFileSync(new URL("./not-found-page.component.html", import.meta.url), "utf8");

describe("NotFoundPageComponent template", () => {
  it("offers a route back to the home page", () => {
    expect(template).toContain("Página no encontrada");
    expect(template).toContain("Volver al inicio");
  });
});
