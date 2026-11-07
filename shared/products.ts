export type Category =
  | "Herramientas eléctricas"
  | "Herramientas manuales"
  | "Pinturas"
  | "Electricidad"
  | "Gasfitería"
  | "Construcción";

export interface Product {
  id: string;
  name: string;
  category: string;
  project?: string;
  brand?: string;
  price: number;
  description?: string;
  oldPrice?: number;
  featured?: boolean;
  isNew?: boolean;
  image: string;
}

export const categories: Category[] = [
  "Herramientas eléctricas",
  "Herramientas manuales",
  "Pinturas",
  "Electricidad",
  "Gasfitería",
  "Construcción",
];

export const products: Product[] = [
  {
    id: "p1",
    name: "Taladro percutor 20V inalámbrico",
    category: "Herramientas eléctricas",
    price: 389.9,
    oldPrice: 459.9,
    featured: true,
    image: "/assets/p-drill.jpg",
  },
  {
    id: "p2",
    name: 'Sierra circular 7¼" 1400W',
    category: "Herramientas eléctricas",
    price: 329,
    featured: true,
    isNew: true,
    image: "/assets/p-saw.jpg",
  },
  {
    id: "p3",
    name: "Martillo de uña 16 oz mango fibra",
    category: "Herramientas manuales",
    price: 34.9,
    featured: true,
    image: "/assets/p-hand.jpg",
  },
  {
    id: "p4",
    name: "Wincha 8 m antigolpes",
    category: "Herramientas manuales",
    price: 24.5,
    oldPrice: 32,
    image: "/assets/p-hand.jpg",
  },
  {
    id: "p5",
    name: "Pintura látex lavable 4 L",
    category: "Pinturas",
    price: 89.9,
    oldPrice: 109.9,
    featured: true,
    image: "/assets/p-paint.jpg",
  },
  {
    id: "p6",
    name: "Esmalte sintético brillante 1 gl",
    category: "Pinturas",
    price: 74,
    isNew: true,
    image: "/assets/p-paint.jpg",
  },
  {
    id: "p7",
    name: "Extensión eléctrica 10 m 3 tomas",
    category: "Electricidad",
    price: 39.9,
    image: "/assets/p-elec.jpg",
  },
  {
    id: "p8",
    name: "Foco LED 12W luz cálida (pack x4)",
    category: "Electricidad",
    price: 29.9,
    oldPrice: 39.9,
    isNew: true,
    image: "/assets/p-elec.jpg",
  },
  {
    id: "p9",
    name: 'Llave stillson 14"',
    category: "Gasfitería",
    price: 58,
    featured: true,
    image: "/assets/p-hand.jpg",
  },
  {
    id: "p10",
    name: 'Tubo PVC 1/2" x 5 m',
    category: "Gasfitería",
    price: 12.9,
    image: "/assets/p-build.jpg",
  },
  {
    id: "p11",
    name: "Cemento Portland tipo I 42.5 kg",
    category: "Construcción",
    price: 31.5,
    featured: true,
    image: "/assets/p-build.jpg",
  },
  {
    id: "p12",
    name: 'Amoladora angular 4½" 850W',
    category: "Herramientas eléctricas",
    price: 199,
    oldPrice: 249,
    isNew: true,
    image: "/assets/p-saw.jpg",
  },
];

export const formatPrice = (value: number): string => `S/ ${value.toFixed(2)}`;

export const discount = (product: Product): number =>
  product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

export const FREE_SHIPPING_FROM = 199;
export const SHIPPING_COST = 15;

export const calcShipping = (subtotal: number): number =>
  subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;

export const PAYMENT_METHODS = ["contraentrega", "transferencia", "yape"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const paymentLabels: Record<PaymentMethod, string> = {
  contraentrega: "Pago contra entrega",
  transferencia: "Transferencia bancaria",
  yape: "Yape / Plin",
};

export const ORDER_STATUSES = [
  "pendiente",
  "confirmado",
  "en camino",
  "entregado",
  "cancelado",
] as const;
