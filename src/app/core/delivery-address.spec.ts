import { describe, expect, it } from "vitest";

import { formatDeliveryAddress, type DeliveryAddress } from "./delivery-address";

const base: DeliveryAddress = {
  street: "Av. Los Olivos",
  noNumber: false,
  apartment: "",
  department: "Lima",
  province: "Lima",
  district: "San Martín de Porres",
  ubigeo: "150135",
  mapUrl: null,
};

describe("formatDeliveryAddress", () => {
  it("joins street, district, province, department and ubigeo", () => {
    expect(formatDeliveryAddress(base)).toBe(
      "Av. Los Olivos, San Martín de Porres, Lima, Lima (Ubigeo 150135)",
    );
  });

  it("adds no-number flag, apartment and map link", () => {
    expect(
      formatDeliveryAddress({
        ...base,
        noNumber: true,
        apartment: "Int. 4B",
        mapUrl: "https://www.google.com/maps?q=-12.000000,-77.000000",
      }),
    ).toBe(
      "Av. Los Olivos (sin número), Dpto/Int: Int. 4B, San Martín de Porres, Lima, Lima (Ubigeo 150135) | Mapa: https://www.google.com/maps?q=-12.000000,-77.000000",
    );
  });
});
