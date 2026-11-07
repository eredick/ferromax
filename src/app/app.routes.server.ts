import { RenderMode, ServerRoute } from "@angular/ssr";

export const serverRoutes: ServerRoute[] = [
  { path: "", renderMode: RenderMode.Server },
  { path: "ofertas", renderMode: RenderMode.Server },
  { path: "lanzamientos", renderMode: RenderMode.Server },
  // El carrito depende de localStorage y de la ubicación del usuario.
  { path: "carrito", renderMode: RenderMode.Client },
  { path: "nosotros", renderMode: RenderMode.Prerender },
  { path: "tiendas", renderMode: RenderMode.Prerender },
  { path: "servicios", renderMode: RenderMode.Prerender },
  { path: "blog", renderMode: RenderMode.Prerender },
  { path: "contacto", renderMode: RenderMode.Prerender },
  { path: "**", renderMode: RenderMode.Server, status: 404 },
];
