import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  linkedSignal,
  signal,
} from "@angular/core";
import { DOCUMENT, NgOptimizedImage } from "@angular/common";
import { RouterLink } from "@angular/router";

import { type Product } from "../../../../shared/products";
import { ProductGridComponent } from "../../shared/product-grid.component";
import { FilterSelectComponent } from "../../shared/filter-select.component";
import { LocationMapComponent } from "../../shared/location-map.component";
import { ProductService } from "../../services/product.service";
import { CartService } from "../../services/cart.service";
import { WHATSAPP_PHONE_NUMBER } from "../../config/catalog.config";

const slides = [
  {
    image: "/assets/slide1.jpg",
    tag: "Bienvenido",
    title: "Todo para tu obra en un solo lugar",
    text: "Más de 5,000 productos para construcción, hogar y taller.",
    cta: "Ver ofertas",
    link: "/ofertas",
  },
  {
    image: "/assets/slide2.jpg",
    tag: "Lanzamientos",
    title: "Herramientas eléctricas de nueva generación",
    text: "Potencia profesional con garantía oficial.",
    cta: "Ver novedades",
    link: "/lanzamientos",
  },
  {
    image: "/assets/slide3.jpg",
    tag: "Pinturas",
    title: "Renueva tus espacios hasta 30% dscto.",
    text: "Látex, esmaltes y accesorios para pintar como un experto.",
    cta: "Comprar ahora",
    link: "/ofertas",
  },
];

type ProductTab = "Destacados" | "Ofertas" | "Recientes";
type BenefitIcon = "truck" | "shield-check" | "headset" | "store";

const MAX_HOME_PRODUCTS = 24;
const FEATURED_BRANDS_COUNT = 12;
const LOGO_EXTENSIONS = ["png", "svg"];
// Archivos existentes en public/assets/brands. Agrega aquí cada logo nuevo (p. ej. "pavco.png")
// para que se use; las marcas que no figuran muestran su nombre sin generar errores 404.
const AVAILABLE_LOGOS = new Set(["bticino.svg", "opalux.png", "truper.svg"]);
const GENERIC_BRANDS = new Set(["sin marca", "nacional", "importado", "otros", "generico"]);

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function brandSlug(name: string): string {
  return normalizeText(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

@Component({
  selector: "app-home-page",
  standalone: true,
  imports: [
    NgOptimizedImage,
    RouterLink,
    ProductGridComponent,
    FilterSelectComponent,
    LocationMapComponent,
  ],
  templateUrl: "./home-page.component.html",
})
export class HomePageComponent {
  private readonly productService = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly document = inject(DOCUMENT);

  constructor() {
    const destroyRef = inject(DestroyRef);
    // Todo lo que sigue es exclusivo del navegador: en el servidor el catálogo ya viene cargado
    // por AppComponent y un temporizador mantendría la respuesta abierta.
    afterNextRender(() => {
      // Al entrar al Home se refresca el catálogo, salvo que se haya cargado hace pocos segundos.
      if (this.productService.catalogAgeMs > 10_000) {
        this.productService.refresh({ refreshImages: false }).subscribe({
          next: () => this.cart.setCatalog(this.productService.storeProducts()),
          error: () => undefined,
        });
      }
      const timer = window.setInterval(() => this.next(), 6000);
      destroyRef.onDestroy(() => window.clearInterval(timer));
    });
  }
  readonly slides = slides;
  readonly tabs: ProductTab[] = ["Destacados", "Ofertas", "Recientes"];
  readonly categories = computed(() =>
    [...new Set(this.productService.storeProducts().map((product) => product.category))].sort(
      (a, b) => a.localeCompare(b, "es"),
    ),
  );
  readonly projects = computed(() =>
    [
      ...new Set(
        this.productService
          .storeProducts()
          .map((product) => product.project)
          .filter((project): project is string => !!project),
      ),
    ].sort((a, b) => a.localeCompare(b, "es")),
  );
  readonly selectedCategory = signal<string | null>(null);
  readonly selectedProject = signal<string | null>(null);
  readonly selectedBrand = signal<string | null>(null);
  readonly query = signal("");
  readonly activeTab = signal<ProductTab>("Destacados");
  readonly filterState = computed(
    () =>
      `${this.activeTab()}|${this.selectedCategory() ?? ""}|${this.selectedProject() ?? ""}|${this.selectedBrand() ?? ""}|${this.query()}`,
  );
  readonly limit = linkedSignal({
    source: () => this.filterState(),
    computation: () => MAX_HOME_PRODUCTS,
  });
  readonly featuredBrands = computed(() => {
    const counts = new Map<string, number>();
    for (const product of this.productService.storeProducts()) {
      const brand = product.brand?.trim();
      if (!brand || GENERIC_BRANDS.has(normalizeText(brand))) continue;
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, FEATURED_BRANDS_COUNT)
      .map(([name, total]) => ({ name, total }));
  });
  readonly hasActiveFilters = computed(
    () =>
      !!this.selectedCategory() ||
      !!this.selectedProject() ||
      !!this.selectedBrand() ||
      !!this.query().trim(),
  );
  readonly filteredProducts = computed<Product[]>(() => {
    const all = this.productService.storeProducts();
    if (!this.hasActiveFilters()) {
      switch (this.activeTab()) {
        case "Ofertas":
          return all.filter((product) => product.oldPrice);
        case "Recientes":
          return all.filter((product) => product.isNew);
        default:
          return all.filter((product) => product.featured);
      }
    }
    const category = this.selectedCategory();
    const project = this.selectedProject();
    const brand = this.selectedBrand();
    const text = normalizeText(this.query());
    return all.filter(
      (product) =>
        (!category || product.category === category) &&
        (!project || product.project === project) &&
        (!brand || product.brand === brand) &&
        (!text || normalizeText(`${product.name} ${product.id}`).includes(text)),
    );
  });
  readonly visibleProducts = computed(() => this.filteredProducts().slice(0, this.limit()));
  readonly hasMore = computed(() => this.filteredProducts().length > this.limit());
  readonly catalogTitle = computed(
    () =>
      this.selectedBrand() ??
      this.selectedCategory() ??
      this.selectedProject() ??
      "Productos para cada proyecto",
  );
  readonly index = signal(0);
  readonly currentSlide = computed(() => slides[this.index()] ?? slides.at(0)!);
  readonly benefits = [
    {
      icon: "truck" as const satisfies BenefitIcon,
      title: "Envío a domicilio",
      detail: "Gratis desde S/ 199",
    },
    {
      icon: "shield-check" as const satisfies BenefitIcon,
      title: "Garantía oficial",
      detail: "En todas las marcas",
    },
    {
      icon: "headset" as const satisfies BenefitIcon,
      title: "Asesoría experta",
      detail: "Lun a Sáb 8am–7pm",
    },
    {
      icon: "store" as const satisfies BenefitIcon,
      title: "Recojo en tienda",
      detail: "En 4 sedes",
    },
  ];
  private readonly failedLogos = signal<ReadonlyMap<string, number>>(new Map());

  // Los logos se colocan en public/assets/brands/<slug>.png o .svg (ver brandSlug) y se registran
  // en AVAILABLE_LOGOS.
  brandLogo(name: string): string | null {
    const slug = brandSlug(name);
    const file = LOGO_EXTENSIONS.map((extension) => `${slug}.${extension}`).find((candidate) =>
      AVAILABLE_LOGOS.has(candidate),
    );
    return file && !this.failedLogos().has(name) ? `/assets/brands/${file}` : null;
  }

  onLogoError(name: string): void {
    this.failedLogos.update((current) => new Map(current).set(name, 1));
  }

  quoteListUrl(): string {
    const phone = WHATSAPP_PHONE_NUMBER.replace(/\D/g, "");
    const message = "Hola, deseo cotizar la siguiente lista de materiales para mi obra...";
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  showMore(): void {
    this.limit.update((value) => value + MAX_HOME_PRODUCTS);
  }

  selectBrand(brand: string | null): void {
    this.selectedBrand.set(brand);
    if (brand) this.scrollToCatalog();
  }

  setQuery(value: string): void {
    this.query.set(value);
  }

  clearFilters(): void {
    this.selectedCategory.set(null);
    this.selectedProject.set(null);
    this.selectedBrand.set(null);
    this.query.set("");
  }

  selectTab(tab: ProductTab): void {
    this.clearFilters();
    this.activeTab.set(tab);
  }

  private scrollToCatalog(): void {
    this.document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  }

  next(): void {
    this.index.update((current) => (current + 1) % slides.length);
  }

  previous(): void {
    this.index.update((current) => (current + slides.length - 1) % slides.length);
  }
}
