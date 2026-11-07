import type { UbigeoDepartment } from "../services/ubigeo.service";

// Campos relevantes de `address` en la respuesta de Nominatim (jsonv2).
export type GeoAddress = Partial<Record<string, string>>;

export interface UbigeoMatch {
  departmentCode: string;
  provinceCode: string;
  districtCode: string;
}

const DISTRICT_KEYS = [
  "suburb",
  "city_district",
  "district",
  "municipality",
  "town",
  "village",
  "city",
  "county",
  "neighbourhood",
  "quarter",
];
const DEPARTMENT_KEYS = ["state", "region"];
const PROVINCE_KEYS = ["county", "state_district", "city", "region", "municipality"];

export function normalizePlace(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^(distrito|provincia|departamento|region|municipalidad) de /, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function candidates(address: GeoAddress, keys: string[]): string[] {
  return keys
    .map((key) => address[key])
    .filter((value): value is string => !!value?.trim())
    .map(normalizePlace);
}

/** Busca departamento, provincia y distrito del árbol de ubigeo a partir de una dirección de Nominatim. */
export function matchUbigeo(
  departments: readonly UbigeoDepartment[],
  address: GeoAddress,
): UbigeoMatch | null {
  const departmentNames = candidates(address, DEPARTMENT_KEYS);
  const department = departments.find((item) => departmentNames.includes(normalizePlace(item.name)));
  if (!department) return null;

  const provinceNames = candidates(address, PROVINCE_KEYS);
  for (const districtName of candidates(address, DISTRICT_KEYS)) {
    const matches = department.provinces.flatMap((province) =>
      province.districts
        .filter((district) => normalizePlace(district.name) === districtName)
        .map((district) => ({ province, district })),
    );
    if (!matches.length) continue;
    const best =
      matches.find(({ province }) => provinceNames.includes(normalizePlace(province.name))) ??
      matches[0]!;
    return {
      departmentCode: department.code,
      provinceCode: best.province.code,
      districtCode: best.district.code,
    };
  }

  const province = department.provinces.find((item) =>
    provinceNames.includes(normalizePlace(item.name)),
  );
  return province
    ? { departmentCode: department.code, provinceCode: province.code, districtCode: "" }
    : null;
}

/** Nombre de la vía con su número cuando existe. */
export function streetFromAddress(address: GeoAddress): string {
  const road = (address["road"] ?? address["pedestrian"] ?? address["footway"] ?? "").trim();
  if (!road) return "";
  const number = address["house_number"]?.trim();
  return number ? `${road} ${number}` : road;
}
