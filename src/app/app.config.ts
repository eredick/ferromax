import { provideHttpClient, withFetch } from "@angular/common/http";
import { ApplicationConfig } from "@angular/core";
import {
  provideClientHydration,
  withEventReplay,
  withNoHttpTransferCache,
} from "@angular/platform-browser";
import { provideRouter, withInMemoryScrolling } from "@angular/router";

import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: "top" })),
    // El catálogo se transfiere con TransferState (ver ProductService) para no duplicar el payload.
    provideClientHydration(withEventReplay(), withNoHttpTransferCache()),
  ],
};
