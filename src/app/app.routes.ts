import { Routes } from "@angular/router";

import { CartPageComponent } from "./pages/cart-page/cart-page.component";
import { ContentPageComponent } from "./pages/content-page/content-page.component";
import { HomePageComponent } from "./pages/home-page/home-page.component";
import { NotFoundPageComponent } from "./pages/not-found-page/not-found-page.component";
import { ProductListPageComponent } from "./pages/product-list-page/product-list-page.component";

export const routes: Routes = [
  {
    path: "",
    component: HomePageComponent,
    pathMatch: "full",
    title: "Ferromax — Herramientas y materiales online",
    data: {
      description:
        "Compra herramientas, pinturas, electricidad y materiales de construcción. Arma tu carrito y haz tu pedido en línea.",
    },
  },
  {
    path: "ofertas",
    component: ProductListPageComponent,
    title: "Ofertas — Ferromax",
    data: {
      description: "Descuentos en herramientas, pinturas y materiales.",
      title: "ofertas",
    },
  },
  {
    path: "lanzamientos",
    component: ProductListPageComponent,
    title: "Lanzamientos — Ferromax",
    data: {
      description: "Las novedades más recientes en herramientas y materiales.",
      title: "lanzamientos",
    },
  },
  {
    path: "carrito",
    component: CartPageComponent,
    title: "Carrito de compras — Ferromax",
    data: { description: "Revisa tu carrito y realiza tu pedido." },
  },
  {
    path: "nosotros",
    component: ContentPageComponent,
    title: "Nosotros — Ferromax",
    data: {
      page: "nosotros",
      description: "Conoce nuestra historia y compromiso con nuestros clientes.",
    },
  },
  {
    path: "tiendas",
    component: ContentPageComponent,
    title: "Tiendas — Ferromax",
    data: {
      page: "tiendas",
      description: "Encuentra la tienda más cercana, horarios y teléfonos.",
    },
  },
  {
    path: "servicios",
    component: ContentPageComponent,
    title: "Servicios — Ferromax",
    data: {
      page: "servicios",
      description: "Delivery, cortes a medida, preparación de pintura y más.",
    },
  },
  {
    path: "blog",
    component: ContentPageComponent,
    title: "Blog — Ferromax",
    data: {
      page: "blog",
      description: "Consejos, guías y tutoriales para tus proyectos.",
    },
  },
  {
    path: "contacto",
    component: ContentPageComponent,
    title: "Contacto — Ferromax",
    data: {
      page: "contacto",
      description:
        "Escríbenos por WhatsApp, llámanos o envía tu consulta: te ayudamos con tu proyecto.",
    },
  },
  {
    path: "**",
    component: NotFoundPageComponent,
    title: "Página no encontrada — Ferromax",
  },
];
