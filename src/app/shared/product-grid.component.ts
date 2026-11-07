import { Component, input, signal } from "@angular/core";
import { NgOptimizedImage } from "@angular/common";

import { PRODUCT_IMAGE_PLACEHOLDER } from "../config/catalog.config";
import { CartService } from "../services/cart.service";
import { NotificationService } from "../core/notification.service";
import { discount, formatPrice, type Product } from "../../../shared/products";

@Component({
  selector: "app-product-grid",
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: "./product-grid.component.html",
})
export class ProductGridComponent {
  readonly items = input<Product[]>([]);

  constructor(
    private readonly cart: CartService,
    private readonly notifications: NotificationService,
  ) {}

  readonly discount = discount;
  readonly formatPrice = formatPrice;
  private readonly loadedImages = signal<ReadonlySet<string>>(new Set());
  private readonly failedImages = signal<ReadonlySet<string>>(new Set());
  private readonly retriedImages = signal<ReadonlyMap<string, number>>(new Map());

  imageKey(product: Product): string {
    return `${product.id}:${product.image}`;
  }

  isImageLoaded(product: Product): boolean {
    return this.loadedImages().has(this.imageKey(product));
  }

  isImageFailed(product: Product): boolean {
    return this.failedImages().has(this.imageKey(product));
  }

  onImageLoad(product: Product): void {
    const key = this.imageKey(product);
    this.loadedImages.update((current) => new Set(current).add(key));
  }

  imageSrc(product: Product): string {
    if (this.isImageFailed(product)) return PRODUCT_IMAGE_PLACEHOLDER;
    const retry = this.retriedImages().get(this.imageKey(product));
    if (!retry || !/^https?:\/\//i.test(product.image)) return product.image;
    return `${product.image}?r=${retry}`;
  }

  onImageError(product: Product): void {
    const key = this.imageKey(product);
    if (this.failedImages().has(key)) return;
    // Primer fallo: un reintento con URL distinta para saltar un 404 guardado en la caché.
    if (!this.retriedImages().has(key) && /^https?:\/\//i.test(product.image)) {
      this.retriedImages.update((current) => new Map(current).set(key, Date.now()));
      return;
    }
    this.failedImages.update((current) => new Set(current).add(key));
  }

  add(product: Product): void {
    if (!this.cart.add(product.id)) {
      this.notifications.error("El límite es de 100 000 unidades por producto.");
      return;
    }
    this.notifications.success("Agregado al carrito", product.name);
  }
}
