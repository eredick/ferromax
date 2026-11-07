import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";

// Formato compacto de /assets/data/ubigeo.json (códigos INEI de 2, 4 y 6 dígitos).
export interface UbigeoDistrict {
  readonly code: string;
  readonly name: string;
}

export interface UbigeoProvince {
  readonly code: string;
  readonly name: string;
  readonly districts: readonly UbigeoDistrict[];
}

export interface UbigeoDepartment {
  readonly code: string;
  readonly name: string;
  readonly provinces: readonly UbigeoProvince[];
}

type RawDepartment = { c: string; n: string; p: { c: string; n: string; d: [string, string][] }[] };

@Injectable({ providedIn: "root" })
export class UbigeoService {
  private readonly http = inject(HttpClient);
  private readonly data = signal<readonly UbigeoDepartment[]>([]);
  private readonly failed = signal(false);
  private started = false;

  readonly departments = this.data.asReadonly();
  readonly loadFailed = this.failed.asReadonly();

  load(): void {
    if (this.started) return;
    this.started = true;
    this.http.get<RawDepartment[]>("/assets/data/ubigeo.json").subscribe({
      next: (raw) =>
        this.data.set(
          raw.map((department) => ({
            code: department.c,
            name: department.n,
            provinces: department.p.map((province) => ({
              code: province.c,
              name: province.n,
              districts: province.d.map(([code, name]) => ({ code, name })),
            })),
          })),
        ),
      error: () => {
        this.started = false;
        this.failed.set(true);
      },
    });
  }
}
