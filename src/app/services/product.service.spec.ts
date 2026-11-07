import "@angular/compiler";
import { HttpClient } from "@angular/common/http";
import { inject, Injector, PLATFORM_ID, TransferState } from "@angular/core";
import { of } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductService } from "./product.service";

vi.mock("../config/catalog.config", () => ({
  PRODUCTS_URL: "/assets/data/products.json",
  CLOUDINARY_IMAGE_BASE_URL: "https://res.cloudinary.com/test/image/upload",
  PRODUCT_IMAGE_PLACEHOLDER: "/assets/images/placeholder.png",
}));

describe("ProductService catalog refresh", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps image URLs on automatic refresh while applying catalog changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    let payload = [
      { codigo: "1000", nombre: "Producto", categoria: "Otros", precio: 5, imagenUrl: "1000.jpg" },
    ];
    const get = vi.fn(() => of(payload));
    const injector = Injector.create({
      providers: [
        { provide: PLATFORM_ID, useValue: "server" },
        { provide: TransferState, useFactory: () => new TransferState() },
        { provide: HttpClient, useValue: { get } },
        { provide: ProductService, useFactory: () => new ProductService(inject(HttpClient)) },
      ],
    });
    const service = injector.get(ProductService);
    service.loadProducts().subscribe();
    const initialImage = service.storeProducts()[0].image;

    vi.advanceTimersByTime(61_000);
    payload = [{ ...payload[0], precio: 10 }];
    service.refresh({ refreshImages: false }).subscribe();

    expect(get).toHaveBeenCalledTimes(2);
    expect(service.storeProducts()[0].price).toBe(10);
    expect(service.storeProducts()[0].image).toBe(initialImage);

    service.refresh().subscribe();
    expect(service.storeProducts()[0].image).not.toBe(initialImage);

    payload = [{ ...payload[0], imagenUrl: "1001.jpg" }];
    service.refresh({ refreshImages: false }).subscribe();
    expect(service.storeProducts()[0].image).toContain("/1001");
    injector.destroy();
  });
});
