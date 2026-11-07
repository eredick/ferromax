import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const template = readFileSync(new URL("./app.component.html", import.meta.url), "utf8");

describe("AppComponent template", () => {
  it("contains the global navigation and notification region", () => {
    expect(template).toContain("Navegación principal");
    expect(template).toContain('aria-live="polite"');
    expect(template).toContain("Consultar por WhatsApp");
    expect(template).not.toContain("Iniciar sesión");
  });
});
