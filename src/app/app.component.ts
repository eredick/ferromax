import { isPlatformBrowser } from "@angular/common";
import { Component, HostListener, inject, OnDestroy, PLATFORM_ID, signal } from "@angular/core";
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { Meta } from "@angular/platform-browser";
import { filter, Subscription } from "rxjs";

import { WHATSAPP_PHONE_NUMBER } from "./config/catalog.config";
import { NotificationService } from "./core/notification.service";
import { CartService } from "./services/cart.service";
import { ProductService } from "./services/product.service";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/nosotros", label: "Nosotros" },
  { path: "/tiendas", label: "Tiendas" },
  { path: "/ofertas", label: "Ofertas" },
  { path: "/lanzamientos", label: "Lanzamientos" },
  { path: "/servicios", label: "Servicios" },
  { path: "/blog", label: "Blog" },
  { path: "/contacto", label: "Contacto" },
];

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnDestroy {
  readonly navItems = navItems;
  readonly cart: CartService;
  readonly notifications: NotificationService;
  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);
  private readonly routerEvents: Subscription;
  private readonly productService: ProductService;
  private lastRefresh = Date.now();
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  @HostListener("window:scroll")
  onScroll(): void {
    if (this.isBrowser) this.scrolled.set(window.scrollY > 8);
  }

  // Al volver a la pestaña se refresca el catálogo si pasaron más de 60 s.
  @HostListener("document:visibilitychange")
  onVisibilityChange(): void {
    if (
      this.isBrowser &&
      document.visibilityState === "visible" &&
      Date.now() - this.lastRefresh > 60_000
    ) {
      this.refreshCatalog(false, false);
    }
  }

  refreshCatalog(showFeedback = false, refreshImages = true): void {
    this.lastRefresh = Date.now();
    this.productService.refresh({ refreshImages }).subscribe({
      next: () => {
        this.cart.setCatalog(this.productService.storeProducts());
        if (showFeedback) this.notifications.success("Catálogo actualizado.");
      },
      error: () => {
        if (showFeedback) this.notifications.error("No se pudo actualizar el catálogo.");
      },
    });
  }

  constructor(
    router: Router,
    cart: CartService,
    notifications: NotificationService,
    private readonly meta: Meta,
    private readonly activatedRoute: ActivatedRoute,
    productService: ProductService,
  ) {
    this.productService = productService;
    this.cart = cart;
    this.notifications = notifications;
    this.cart.setCatalog(productService.storeProducts());
    // Si el servidor ya envió el catálogo no se vuelve a pedir durante la hidratación.
    if (!productService.isLoaded) {
      productService.loadProducts().subscribe({
        next: () => this.cart.setCatalog(productService.storeProducts()),
        error: (error: unknown) => {
          this.cart.setCatalog(productService.storeProducts());
          console.error("Se conservará el catálogo local tras fallar la carga remota.", error);
          this.notifications.error(
            "No se pudo actualizar el catálogo. Se muestran los productos locales.",
          );
        },
      });
    }
    this.routerEvents = router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.menuOpen.set(false);
        this.updateMeta();
      });
    this.updateMeta();
  }

  ngOnDestroy(): void {
    this.routerEvents.unsubscribe();
  }

  waLink(message: string): string {
    return `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  private updateMeta(): void {
    let route = this.activatedRoute;
    while (route.firstChild) route = route.firstChild;

    const description = route.snapshot.data["description"];
    if (typeof description === "string") {
      this.meta.updateTag({ name: "description", content: description });
    }
    const robots = route.snapshot.data["robots"];
    if (robots === "noindex") {
      this.meta.updateTag({ name: "robots", content: "noindex" });
    } else {
      this.meta.removeTag('name="robots"');
    }
  }
}
