// Google Sheets API v4. En una app Angular la clave queda visible en el navegador, por lo que
// debes restringirla en Google Cloud Console (Credenciales > tu clave):
//  - Restricciones de aplicación: sitios web (HTTP referrers) con tu dominio y localhost.
//  - Restricciones de API: solo "Google Sheets API".
// La hoja debe compartirse como "Cualquier persona con el enlace: Lector".
// La clave y el ID viven en catalog.secrets.ts (ignorado por Git).
import { GOOGLE_SHEETS_API_KEY, GOOGLE_SHEET_ID } from "./catalog.secrets";
// Nombre de la pestaña y rango. Encabezados de la hoja: SKU, PRODUCTO, MARCA, CATEGORÍA,
// UNIDAD, PRECIO VENTA, ESTADO, STOCK, OFERTA (% de descuento), ..., IMAGEN (columna K).
export const GOOGLE_SHEET_RANGE = "Catalogo!A:K";

const LOCAL_PRODUCTS_URL = "/assets/data/products.json";

// Si falta la clave o el ID se usa el JSON local.
export const PRODUCTS_URL =
  GOOGLE_SHEETS_API_KEY && GOOGLE_SHEET_ID
    ? `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(GOOGLE_SHEET_ID)}/values/${encodeURIComponent(GOOGLE_SHEET_RANGE)}?key=${encodeURIComponent(GOOGLE_SHEETS_API_KEY)}`
    : LOCAL_PRODUCTS_URL;

// Las imágenes viven en Cloudinary con el SKU como Public ID, sin carpeta en la ruta de entrega
// (p. ej. .../1000.webp). La columna IMAGEN de la hoja lleva el nombre del archivo (1000.jpg);
// Cloudinary ignora la extensión original y entrega el mejor formato (f_auto).
export const CLOUDINARY_IMAGE_BASE_URL =
  "https://res.cloudinary.com/z3dvwu4w/image/upload/f_auto,q_auto,w_400";
// Configura el número internacional sin +, espacios ni guiones.
export const WHATSAPP_PHONE_NUMBER = "51997717745";

// Correo de la empresa; el Google Apps Script lo usa como destinatario de pedidos y contactos.
export const SELLER_EMAIL = "vend1.accione@gmail.com";

export const STORE_LOCATION = {
  lat: -11.991969,
  lng: -77.097755,
  label: "TodoFerroMax - San Martín de Porres, Lima",
};

export const PRODUCT_IMAGE_PLACEHOLDER = "/assets/images/placeholder.png";
