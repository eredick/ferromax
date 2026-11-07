import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const template = readFileSync(new URL("./content-page.component.html", import.meta.url), "utf8");

describe("ContentPageComponent template", () => {
  it("contains the content sections", () => {
    expect(template).toContain("Más de 20 años ayudando a construir");
    expect(template).toContain("Visítanos en nuestras sedes");
    expect(template).toContain("Escribir por WhatsApp");
    expect(template).toContain('title="¿En qué podemos ayudarte?" [compact]="true"');
  });
});
