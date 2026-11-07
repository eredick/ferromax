import { Component, inject } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import { STORE_LOCATION } from "../config/catalog.config";

@Component({
  selector: "app-location-map",
  standalone: true,
  template: `
    <section class="container-x mt-12 mb-10" aria-labelledby="ubicacion-title">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="ubicacion-title" class="text-xl font-bold md:text-2xl">Nuestra ubicación</h2>
          <p class="text-sm text-muted-foreground">{{ location.label }}</p>
        </div>
        <a
          [href]="directionsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="group inline-flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-ink-foreground shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-ink/85 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-4 w-4"
            aria-hidden="true"
          >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          Cómo llegar
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          >
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </a>
      </div>
      <div class="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <iframe
          [src]="embedUrl"
          title="Mapa de ubicación de la tienda"
          class="block h-72 w-full border-0 md:h-96"
          loading="lazy"
          allowfullscreen
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </section>
  `,
})
export class LocationMapComponent {
  readonly location = STORE_LOCATION;
  readonly directionsUrl = `https://www.google.com/maps?q=${STORE_LOCATION.lat},${STORE_LOCATION.lng}`;
  readonly embedUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(
    `https://maps.google.com/maps?q=${STORE_LOCATION.lat},${STORE_LOCATION.lng}&z=16&output=embed`,
  );
}
