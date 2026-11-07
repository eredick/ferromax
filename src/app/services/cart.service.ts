import { isPlatformBrowser } from "@angular/common";
import { afterNextRender, computed, inject, Injectable, PLATFORM_ID, signal } from "@angular/core";

import { products, type Product } from "../../../shared/products";
import { MAX_ORDER_QUANTITY } from "../../../shared/order";
import { WHATSAPP_PHONE_NUMBER } from "../config/catalog.config";

type CartLine = { id: string; qty: number };
export type FullCartLine = CartLine & { product: Product };

export interface OrderContact {
  name: string;
  address: string;
  phone: string;
  email?: string;
}

const STORAGE_KEY = "ferromax-cart";

@Injectable({ providedIn: "root" })
export class CartService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly storedLines = signal<CartLine[]>([]);
  private readonly catalog = signal<Product[]>(products);

  readonly lines = computed(() =>
    this.storedLines()
      .map((line) => {
        const product = this.catalog().find((item) => item.id === line.id);
        return product ? { ...line, product } : null;
      })
      .filter((line): line is FullCartLine => line !== null),
  );

  readonly count = computed(() => this.lines().reduce((sum, line) => sum + line.qty, 0));
  readonly total = computed(() =>
    this.lines().reduce((sum, line) => sum + line.qty * line.product.price, 0),
  );

  constructor() {
    // El carrito guardado se lee tras la hidratación para que el primer render coincida con el
    // HTML del servidor, que nunca tiene acceso a localStorage.
    afterNextRender(() => this.storedLines.set(this.readStoredLines()));
  }

  setCatalog(items: Product[]): void {
    this.catalog.set(items);
  }

  add(id: string): boolean {
    if (!this.catalog().some((product) => product.id === id)) {
      throw new Error(`No existe el producto ${id}.`);
    }
    if (this.storedLines().some((line) => line.id === id && line.qty >= MAX_ORDER_QUANTITY)) {
      return false;
    }
    this.update((lines) =>
      lines.some((line) => line.id === id)
        ? lines.map((line) => (line.id === id ? { ...line, qty: line.qty + 1 } : line))
        : [...lines, { id, qty: 1 }],
    );
    return true;
  }

  setQty(id: string, qty: number): void {
    this.update((lines) =>
      qty <= 0
        ? lines.filter((line) => line.id !== id)
        : lines.map((line) =>
            line.id === id ? { ...line, qty: Math.min(qty, MAX_ORDER_QUANTITY) } : line,
          ),
    );
  }

  remove(id: string): void {
    this.update((lines) => lines.filter((line) => line.id !== id));
  }

  clear(): void {
    this.storedLines.set([]);
    this.persist();
  }

  whatsappUrl(phoneNumber = WHATSAPP_PHONE_NUMBER): string {
    const phone = phoneNumber.replace(/\D/g, "");
    if (!phone) throw new Error("Configura un número válido para WhatsApp.");
    const lines = this.lines();
    const message = [
      "Hola, quiero realizar el siguiente pedido:",
      ...lines.map(
        (line) =>
          `- ${line.qty}x ${line.product.name} (${line.product.id}) - S/ ${(line.product.price * line.qty).toFixed(2)}`,
      ),
      `Total: S/ ${this.total().toFixed(2)}`,
    ].join("\n");
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  orderWhatsappUrl(contact: OrderContact, orderCode: string, payment: string): string {
    const phone = WHATSAPP_PHONE_NUMBER.replace(/\D/g, "");
    if (!phone) throw new Error("Configura un número válido para WhatsApp.");
    const [addressText, mapUrl] = contact.address.split(/\s*\|\s*Mapa:\s*/);
    const money = (value: number) => `S/ ${value.toFixed(2)}`;
    const message = [
      `*NUEVO PEDIDO ${orderCode}*`,
      "",
      "*DATOS DEL CLIENTE*",
      `• Nombre: ${contact.name}`,
      `• Teléfono: ${contact.phone}`,
      `• Correo: ${contact.email ?? "No indicado"}`,
      `• Dirección: ${addressText}`,
      ...(mapUrl ? [`• Mapa: ${mapUrl}`] : []),
      "",
      "*FORMA DE PAGO*",
      `• ${payment}`,
      "",
      "*PRODUCTOS*",
      ...this.lines().map(
        (line) =>
          `• ${line.qty} x ${line.product.name} (${line.product.id}) — ${money(line.product.price * line.qty)}`,
      ),
      "",
      `*TOTAL: ${money(this.total())}*`,
      "",
      "Gracias, quedo atento a la confirmación.",
    ].join("\n");
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  private update(updater: (lines: CartLine[]) => CartLine[]): void {
    this.storedLines.update(updater);
    this.persist();
  }

  private readStoredLines(): CartLine[] {
    if (!this.isBrowser) return [];

    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (!value) return [];
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        throw new Error("El carrito guardado tiene un formato no válido.");
      }
      const validLines = parsed.filter(
        (line): line is CartLine =>
          typeof line === "object" &&
          line !== null &&
          "id" in line &&
          typeof line.id === "string" &&
          "qty" in line &&
          typeof line.qty === "number" &&
          Number.isInteger(line.qty) &&
          line.qty > 0,
      );
      const normalizedLines = validLines.map((line) => ({
        ...line,
        qty: Math.min(line.qty, MAX_ORDER_QUANTITY),
      }));
      if (normalizedLines.some((line, index) => line.qty !== validLines[index]?.qty)) {
        console.warn("Se limitó la cantidad de productos del carrito guardado.");
      }
      return normalizedLines;
    } catch (error) {
      console.error("No se pudo leer el carrito guardado.", error);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (storageError) {
        console.error("No se pudo limpiar el carrito guardado.", storageError);
      }
      return [];
    }
  }

  private persist(): void {
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.storedLines()));
    }
  }
}
