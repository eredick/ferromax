import { Component } from "@angular/core";
import { NgOptimizedImage } from "@angular/common";

import { MAX_ORDER_QUANTITY } from "../../../../shared/order";
import { formatPrice } from "../../../../shared/products";
import { PRODUCT_IMAGE_PLACEHOLDER } from "../../config/catalog.config";
import { CartService } from "../../services/cart.service";

@Component({
  selector: "app-cart",
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: "./cart.component.html",
})
export class CartComponent {
  readonly maxQuantity = MAX_ORDER_QUANTITY;
  readonly formatPrice = formatPrice;

  constructor(readonly cart: CartService) {}

  onImageError(event: Event): void {
    const image = event.currentTarget;
    if (
      image instanceof HTMLImageElement &&
      image.getAttribute("src") !== PRODUCT_IMAGE_PLACEHOLDER
    ) {
      image.src = PRODUCT_IMAGE_PLACEHOLDER;
    }
  }

  onQuantityChange(id: string, event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;

    const quantity = Number.parseInt(input.value, 10);
    if (!Number.isFinite(quantity) || quantity < 1) {
      const currentLine = this.cart.lines().find((line) => line.id === id);
      input.value = String(currentLine?.qty ?? 1);
      return;
    }

    const clamped = Math.min(quantity, this.maxQuantity);
    input.value = String(clamped);
    this.cart.setQty(id, clamped);
  }
}
