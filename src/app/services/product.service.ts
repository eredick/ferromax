import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { isPlatformBrowser } from "@angular/common";
import {
  computed,
  inject,
  Injectable,
  makeStateKey,
  PLATFORM_ID,
  signal,
  TransferState,
} from "@angular/core";
import { catchError, EMPTY, finalize, map, Observable, retry, tap, throwError, timer } from "rxjs";

import { categories, products, type Product } from "../../../shared/products";
import {
  CLOUDINARY_IMAGE_BASE_URL,
  PRODUCTS_URL,
  PRODUCT_IMAGE_PLACEHOLDER,
} from "../config/catalog.config";
import type { Producto } from "../models/producto.model";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readPrice(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  let normalized = trimmed.replace(/[^\d,.-]/g, "");
  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");
  if (lastComma > lastDot && /,\d{1,2}$/.test(normalized)) {
    // La coma es el separador decimal (formato "5,00" o "1.299,50").
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }
  const price = Number(normalized);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function asText(value: unknown): unknown {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : value;
}

function asProduct(row: Record<string, unknown>): Producto {
  const codigo = asText(row["codigo"]);
  const nombre = row["nombre"];
  const descripcion = row["descripcion"] ?? "";
  const categoria = row["categoria"];
  const precio = readPrice(row["precio"]);

  if (
    typeof codigo !== "string" ||
    typeof nombre !== "string" ||
    typeof descripcion !== "string" ||
    typeof categoria !== "string" ||
    precio === null
  ) {
    throw new Error("El catálogo contiene un producto con datos no válidos.");
  }
  if (!codigo.trim() || !nombre.trim() || !categoria.trim()) {
    throw new Error("El catálogo no puede contener productos sin código, nombre o categoría.");
  }

  const imagenUrl = asText(row["imagenUrl"]);
  const versionRaw = asText(row["imagenVersion"]);
  const imagenVersion =
    typeof versionRaw === "string" && /^\d{1,12}$/.test(versionRaw.trim())
      ? versionRaw.trim()
      : undefined;
  const precioAnteriorValue = row["precioAnterior"];
  const hasPrecioAnterior =
    precioAnteriorValue !== undefined &&
    !(typeof precioAnteriorValue === "string" && !precioAnteriorValue.trim());
  const precioAnterior = hasPrecioAnterior ? readPrice(precioAnteriorValue) : undefined;
  if (precioAnterior === null) {
    throw new Error(`El precio anterior de ${codigo} no es válido.`);
  }
  const destacado = readBoolean(row["destacado"]);
  const nuevo = readBoolean(row["nuevo"]);

  return {
    codigo: codigo.trim(),
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    precio,
    categoria: categoria.trim(),
    ...(typeof imagenUrl === "string" && imagenUrl.trim() ? { imagenUrl: imagenUrl.trim() } : {}),
    ...(imagenVersion ? { imagenVersion } : {}),
    ...(typeof row["marca"] === "string" && row["marca"].trim()
      ? { marca: row["marca"].trim() }
      : {}),
    ...(typeof row["proyecto"] === "string" && row["proyecto"].trim()
      ? { proyecto: row["proyecto"].trim() }
      : {}),
    ...(precioAnterior === undefined ? {} : { precioAnterior }),
    ...(destacado === undefined ? {} : { destacado }),
    ...(nuevo === undefined ? {} : { nuevo }),
  };
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return undefined;
}

const HEADER_ALIASES: Record<string, string> = {
  sku: "codigo",
  marca: "marca",
  producto: "nombre",
  categoria: "categoria",
  precioventa: "precio",
  proyecto: "proyecto",
  obra: "proyecto",
  oferta: "oferta",
  imagen: "imagenUrl",
  imagenurl: "imagenUrl",
  version: "imagenVersion",
  versionimagen: "imagenVersion",
  imagenversion: "imagenVersion",
};

function normalizeHeader(header: string): string {
  const key = header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return HEADER_ALIASES[key] ?? key;
}

// Convierte "FERRETERÍA" en "Ferretería"; respeta textos que ya combinan mayúsculas y minúsculas.
function formatLabel(value: string): string {
  const text = value.trim().replace(/\s+/g, " ");
  if (!text || text !== text.toLocaleUpperCase("es")) return text;
  const lower = text.toLocaleLowerCase("es");
  return lower.charAt(0).toLocaleUpperCase("es") + lower.slice(1);
}

// Adapta una fila de la hoja: OFERTA es un % de descuento sobre PRECIO VENTA.
function sheetRowToRecord(row: Record<string, unknown>): Record<string, unknown> {
  const record: Record<string, unknown> = { ...row };
  const categoria = typeof row["categoria"] === "string" ? row["categoria"].trim() : "";
  record["categoria"] = formatLabel(categoria) || "Otros";
  if (typeof row["proyecto"] === "string") record["proyecto"] = formatLabel(row["proyecto"]);
  record["descripcion"] = row["descripcion"] ?? row["nombre"] ?? "";

  const precio = readPrice(row["precio"]);
  const descuento = readPrice(row["oferta"]);
  if (precio !== null && descuento !== null && descuento > 0 && descuento < 100) {
    const conOferta = Math.round(precio * (1 - descuento / 100) * 100) / 100;
    // Si el redondeo deja ambos precios iguales no hay oferta real: se muestra solo el original.
    if (conOferta < precio) {
      record["precioAnterior"] = precio;
      record["precio"] = conOferta;
    }
  }
  return record;
}

const HIGHLIGHT_COUNT = 12;

// Si la hoja no trae columnas destacado/nuevo: destacados = primeros con stock,
// nuevos = últimos agregados.
function markHighlights(items: Producto[], keys: string[]): Producto[] {
  const hasFeatured = keys.includes("destacado");
  const hasNew = keys.includes("nuevo");
  if (hasFeatured && hasNew) return items;

  const featured = new Set<string>();
  if (!hasFeatured) {
    for (const item of items) {
      if (featured.size >= HIGHLIGHT_COUNT) break;
      if (item.precio > 0) featured.add(item.codigo);
    }
  }
  const recent = new Set(items.slice(-HIGHLIGHT_COUNT).map((item) => item.codigo));

  return items.map((item) => ({
    ...item,
    ...(hasFeatured ? {} : { destacado: featured.has(item.codigo) }),
    ...(hasNew ? {} : { nuevo: recent.has(item.codigo) }),
  }));
}

function parseCatalog(payload: unknown): Producto[] {
  if (Array.isArray(payload)) {
    if (payload.every(isRecord)) return payload.map(asProduct);
    throw new Error("La respuesta del catálogo debe ser una lista de productos.");
  }

  if (isRecord(payload) && Array.isArray(payload["values"])) {
    const [headerRow, ...dataRows] = payload["values"];
    if (
      !Array.isArray(headerRow) ||
      !headerRow.every((header): header is string => typeof header === "string")
    ) {
      throw new Error("La hoja de cálculo debe incluir una fila de encabezados.");
    }
    const keys = headerRow.map(normalizeHeader);
    const items: Producto[] = [];
    for (const row of dataRows) {
      if (!Array.isArray(row)) continue;
      const record = sheetRowToRecord(
        Object.fromEntries(keys.map((key, index) => [key, row[index] ?? ""])),
      );
      try {
        items.push(asProduct(record));
      } catch {
        // Se omiten filas incompletas para no perder todo el catálogo.
      }
    }
    if (!items.length) throw new Error("La hoja de cálculo no contiene productos válidos.");
    return markHighlights(items, keys);
  }

  throw new Error("La respuesta del catálogo tiene un formato no compatible.");
}

// Catálogo cargado en el servidor; el navegador lo reutiliza en el primer render para que el DOM
// hidratado coincida con el HTML recibido. Sin `payload` el servidor usó el catálogo local.
interface CatalogState {
  payload?: unknown;
  imageCacheBust: number;
}

const CATALOG_STATE_KEY = makeStateKey<CatalogState>("ferromax-catalog");

@Injectable({ providedIn: "root" })
export class ProductService {
  private readonly localCatalog = products.map((product) => ({
    codigo: product.id,
    nombre: product.name,
    descripcion: product.name,
    precio: product.price,
    categoria: product.category,
    imagenUrl: product.image,
    ...(product.oldPrice === undefined ? {} : { precioAnterior: product.oldPrice }),
    ...(product.featured === undefined ? {} : { destacado: product.featured }),
    ...(product.isNew === undefined ? {} : { nuevo: product.isNew }),
  }));
  private readonly catalog = signal<Producto[]>([]);
  private readonly transferState = inject(TransferState);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly refreshing = signal(false);
  private lastLoadedAt = 0;
  private imageCacheBust = Math.floor(Date.now() / 1000);

  /** Milisegundos desde la última carga exitosa del catálogo. */
  get catalogAgeMs(): number {
    return Date.now() - this.lastLoadedAt;
  }

  /** Verdadero si el catálogo remoto ya se cargó (en el servidor o en el navegador). */
  get isLoaded(): boolean {
    return this.lastLoadedAt > 0;
  }

  readonly isRefreshing = this.refreshing.asReadonly();
  readonly items = this.catalog.asReadonly();
  readonly storeProducts = computed(() =>
    this.catalog().map((product) => this.toStoreProduct(product)),
  );

  constructor(private readonly http: HttpClient) {
    this.restoreServerCatalog();
  }

  loadProducts({ refreshImages = true }: { refreshImages?: boolean } = {}): Observable<Producto[]> {
    // Sheets API rechaza parámetros desconocidos, pero acepta quotaUser (cadena libre): sirve
    // como marca de tiempo para que cada petición tenga una URL distinta y evitar cachés.
    const params = PRODUCTS_URL.includes("googleapis.com")
      ? new HttpParams().set("quotaUser", `t${Date.now()}`)
      : new HttpParams().set("_t", Date.now().toString());
    return this.http.get<unknown>(PRODUCTS_URL, { params }).pipe(
      map((payload) => ({ payload, items: parseCatalog(payload) })),
      tap(({ payload, items }) => {
        if (refreshImages) this.imageCacheBust = Math.floor(Date.now() / 1000);
        this.catalog.set(items);
        this.lastLoadedAt = Date.now();
        if (!this.isBrowser) {
          this.transferState.set(CATALOG_STATE_KEY, {
            payload,
            imageCacheBust: this.imageCacheBust,
          });
        }
      }),
      map(({ items }) => items),
      catchError((error: unknown) => {
        // No se registra el error completo: la URL de Sheets contiene la API Key.
        // Si ya hay datos cargados se conservan; el catálogo local solo es el respaldo inicial.
        if (this.catalog().length === 0) {
          this.catalog.set(this.localCatalog);
          if (!this.isBrowser) {
            this.transferState.set(CATALOG_STATE_KEY, { imageCacheBust: this.imageCacheBust });
          }
        }
        console.error(
          "No se pudo cargar el catálogo remoto.",
          error instanceof HttpErrorResponse ? `HTTP ${error.status}` : error,
        );
        return throwError(() => error);
      }),
    );
  }

  /** Vuelve a leer el catálogo sin recargar la página. Reintenta ante fallos transitorios. */
  refresh(options: { refreshImages?: boolean } = {}): Observable<Producto[]> {
    if (this.refreshing()) return EMPTY;
    this.refreshing.set(true);
    return this.loadProducts(options).pipe(
      retry({
        count: 2,
        delay: (error: unknown, attempt) =>
          error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500
            ? throwError(() => error)
            : timer(attempt * 1000),
      }),
      finalize(() => this.refreshing.set(false)),
    );
  }

  imageUrl(product: Pick<Producto, "codigo" | "imagenUrl" | "imagenVersion">): string {
    const source = product.imagenUrl?.trim();
    if (!source) return PRODUCT_IMAGE_PLACEHOLDER;
    if (source.startsWith("/")) return source;
    // Enlaces completos (p. ej. antiguos de Drive) se ignoran: solo importa el nombre del archivo.
    if (/^https?:\/\//i.test(source)) {
      return /^https?:\/\/res\.cloudinary\.com\//i.test(source)
        ? source
        : PRODUCT_IMAGE_PLACEHOLDER;
    }
    const publicId = source.replace(/\.[a-z0-9]{3,4}$/i, "");
    // Cloudinary acepta cualquier /v<número>/ y entrega el archivo vigente; cambiarlo invalida la
    // caché. Se usa la columna VERSION de la hoja o la versión de la carga inicial. Los refrescos
    // automáticos la conservan para no recargar todas las imágenes al regresar a la pestaña.
    const version = product.imagenVersion ?? String(this.imageCacheBust);
    return `${CLOUDINARY_IMAGE_BASE_URL}/v${version}/${encodeURIComponent(publicId)}`;
  }

  private restoreServerCatalog(): void {
    if (!this.isBrowser || !this.transferState.hasKey(CATALOG_STATE_KEY)) return;
    const state = this.transferState.get(CATALOG_STATE_KEY, {
      imageCacheBust: this.imageCacheBust,
    });
    this.transferState.remove(CATALOG_STATE_KEY);
    this.imageCacheBust = state.imageCacheBust;
    if (state.payload === undefined) {
      this.catalog.set(this.localCatalog);
      return;
    }
    try {
      this.catalog.set(parseCatalog(state.payload));
      this.lastLoadedAt = Date.now();
    } catch (error) {
      console.error("No se pudo restaurar el catálogo enviado por el servidor.", error);
    }
  }

  private toStoreProduct(product: Producto): Product {
    const category = categories.find((value) => value === product.categoria);
    return {
      id: product.codigo,
      name: product.nombre,
      description: product.descripcion,
      category: category ?? product.categoria,
      ...(product.proyecto === undefined ? {} : { project: product.proyecto }),
      ...(product.marca === undefined ? {} : { brand: product.marca }),
      price: product.precio,
      ...(product.precioAnterior === undefined ? {} : { oldPrice: product.precioAnterior }),
      ...(product.destacado === undefined ? {} : { featured: product.destacado }),
      ...(product.nuevo === undefined ? {} : { isNew: product.nuevo }),
      image: this.imageUrl(product),
    };
  }
}
