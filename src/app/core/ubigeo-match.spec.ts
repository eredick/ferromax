import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type { UbigeoDepartment } from "../services/ubigeo.service";
import { matchUbigeo, streetFromAddress } from "./ubigeo-match";

type Raw = { c: string; n: string; p: { c: string; n: string; d: [string, string][] }[] };
const raw = JSON.parse(
  readFileSync(new URL("../../../public/assets/data/ubigeo.json", import.meta.url), "utf8"),
) as Raw[];
const departments: UbigeoDepartment[] = raw.map((d) => ({
  code: d.c,
  name: d.n,
  provinces: d.p.map((p) => ({
    code: p.c,
    name: p.n,
    districts: p.d.map(([code, name]) => ({ code, name })),
  })),
}));

describe("matchUbigeo", () => {
  it("matches a Lima district from suburb", () => {
    const address = {
      road: "Avenida Santa Rosa",
      house_number: "28",
      suburb: "San Martín de Porres",
      city: "San Martín de Porres",
      state_district: "Lima Metropolitana",
      state: "Lima",
    };
    expect(matchUbigeo(departments, address)).toEqual({
      departmentCode: "15",
      provinceCode: "1501",
      districtCode: "150135",
    });
    expect(streetFromAddress(address)).toBe("Avenida Santa Rosa 28");
  });

  it("matches Lima cercado", () => {
    expect(
      matchUbigeo(departments, { city: "Lima", state_district: "Lima Metropolitana", state: "Lima" }),
    ).toEqual({ departmentCode: "15", provinceCode: "1501", districtCode: "150101" });
  });

  it("matches Callao", () => {
    const address = { road: "Callejón Villegas", city: "Callao", county: "Callao", state: "Callao" };
    expect(matchUbigeo(departments, address)).toEqual({
      departmentCode: "07",
      provinceCode: "0701",
      districtCode: "070101",
    });
    expect(streetFromAddress(address)).toBe("Callejón Villegas");
  });

  it("returns null outside the known departments", () => {
    expect(matchUbigeo(departments, { state: "Texas" })).toBeNull();
  });
});
