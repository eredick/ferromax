import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { firstValueFrom, timeout } from "rxjs";

import type { GeoAddress } from "../core/ubigeo-match";

interface NominatimResponse {
  address?: GeoAddress;
}

// Servicio público de OpenStreetMap: las coordenadas del cliente se envían a nominatim.openstreetmap.org.
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

@Injectable({ providedIn: "root" })
export class ReverseGeocodeService {
  private readonly http = inject(HttpClient);

  async reverse(lat: number, lon: number): Promise<GeoAddress | null> {
    const params = new HttpParams()
      .set("format", "jsonv2")
      .set("addressdetails", "1")
      .set("accept-language", "es")
      .set("zoom", "18")
      .set("lat", lat.toFixed(6))
      .set("lon", lon.toFixed(6));
    const response = await firstValueFrom(
      this.http.get<NominatimResponse>(NOMINATIM_REVERSE_URL, { params }).pipe(timeout(8000)),
    );
    return response.address ?? null;
  }
}
