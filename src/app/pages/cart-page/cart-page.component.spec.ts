import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const template = readFileSync(new URL("./cart-page.component.html", import.meta.url), "utf8");

describe("CartPageComponent template", () => {
  it("contains the order form and order confirmation", () => {
    expect(template).toContain("Información del cliente");
    expect(template).toContain("lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]");
    expect(template).toContain("<app-cart />");
    expect(template).toContain("Enviar pedido");
    expect(template).toContain("← Seguir comprando");
    expect(template).toContain("sm:grid-cols-2");
    expect(template).toContain("¡Pedido enviado correctamente!");
    expect(template).toContain("Enviar pedido al vendedor por WhatsApp");
    expect(template).not.toContain("Enviar por correo (opcional)");
  });

  it("includes a button to clear the entire cart", () => {
    const cartTemplate = readFileSync(
      new URL("../../components/cart/cart.component.html", import.meta.url),
      "utf8",
    );

    expect(cartTemplate).toContain('type="button"');
    expect(cartTemplate).toContain('(click)="cart.clear()"');
    expect(cartTemplate).toContain("Vaciar carrito");
  });
});
