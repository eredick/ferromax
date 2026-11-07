# Todoferromax

Tienda en línea de Ferromax, construida con Angular. Incluye catálogo, ofertas,
lanzamientos, carrito y páginas informativas.

**Live app**: https://todoferromax.lovable.app

## Desarrollo

Requiere Node.js 20.19+ o 22.12+ y npm.

```sh
npm install
npm run dev
```

```sh
npm run build
npm run preview
```

El build estático queda en `dist/todoferromax/browser`. El hosting debe reenviar
las rutas de la aplicación (por ejemplo, `/carrito`) a `index.html`.

### Catálogo e imágenes

El catálogo se carga mediante `HttpClient` desde `PRODUCTS_URL`, configurado en
`src/app/config/catalog.config.ts`. Por defecto apunta al JSON público
`public/assets/data/products.json`; puede cambiarse por un endpoint JSON publicado
desde Google Sheets. La respuesta puede ser una lista de objetos o el formato
`{ "values": [["codigo", "nombre", "descripcion", "precio", "categoria", "imagenUrl"], ...] }`.

Al volver a la pestaña, el catálogo se actualiza si han pasado más de 60 segundos
desde la última actualización. Para evitar recargar todas las fotos, este refresco
mantiene sus URL cuando el identificador y la versión de imagen no cambian.
Si reemplazas una foto en Cloudinary con el mismo identificador y sin cambiar su
versión en el catálogo, recarga la página para ver la nueva imagen.

Para imágenes de Drive, coloca en `imagenUrl` la URL pública del archivo o su ID
de archivo. Si falta `imagenUrl`, el servicio prueba el código como ID de archivo.
El ID de la carpeta no permite buscar archivos por nombre directamente desde el
navegador; para ese caso se necesita consultar Drive API. Las imágenes que fallen
usan el placeholder local. Configura también `WHATSAPP_PHONE_NUMBER` en ese mismo archivo.

El proyecto es un storefront estático: no usa backend ni base de datos propios.
Los pedidos y los mensajes del formulario de contacto se envían por POST a un
Google Apps Script (`src/app/services/pedido.service.ts`), que los guarda/envía
por correo; el mensaje de WhatsApp es la otra notificación disponible.

El correo de la empresa se configura en `SELLER_EMAIL`
(`vend1.accione@gmail.com`). El script recibe en el cuerpo JSON (`text/plain`):
un pedido (`cliente`, `formaPago`, `items`, `total`) o un contacto
(`tipo: "contacto"`, `destinatario`, `nombre`, `correo`, `mensaje`) y debe
responder `{ "status": "success" }`.

La página de confirmación también ofrece abrir WhatsApp con el pedido y los
datos del cliente listos; por seguridad del navegador y de WhatsApp, el cliente
debe pulsar **Enviar** dentro de WhatsApp para completar ese aviso.

### Pruebas

```sh
npm test
```
