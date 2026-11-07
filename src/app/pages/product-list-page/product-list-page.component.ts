import { Component, computed, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { PageHeaderComponent } from "../../shared/page-header.component";
import { ProductGridComponent } from "../../shared/product-grid.component";
import { ProductService } from "../../services/product.service";

@Component({
  selector: "app-product-list-page",
  standalone: true,
  imports: [PageHeaderComponent, ProductGridComponent],
  templateUrl: "./product-list-page.component.html",
})
export class ProductListPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  readonly content =
    this.route.snapshot.data["title"] === "ofertas"
      ? {
          eyebrow: "Ofertas",
          title: "Precios que construyen",
          description: "Aprovecha descuentos por tiempo limitado en nuestras mejores marcas.",
        }
      : {
          eyebrow: "Lanzamientos",
          title: "Lo nuevo en Ferromax",
          description: "Descubre los productos que acaban de llegar a nuestras tiendas.",
        };

  readonly items = computed(() =>
    this.route.snapshot.data["title"] === "ofertas"
      ? this.productService.storeProducts().filter((product) => product.oldPrice)
      : this.productService.storeProducts().filter((product) => product.isNew),
  );
}
