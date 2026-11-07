export interface DeliveryAddress {
  street: string;
  noNumber: boolean;
  apartment: string;
  department: string;
  province: string;
  district: string;
  ubigeo: string;
  mapUrl: string | null;
}

// Texto único que se envía por WhatsApp y a Google Apps Script como dirección de entrega.
export function formatDeliveryAddress(address: DeliveryAddress): string {
  const street = address.street.trim();
  const apartment = address.apartment.trim();
  const parts = [
    `${street}${address.noNumber ? " (sin número)" : ""}`,
    ...(apartment ? [`Dpto/Int: ${apartment}`] : []),
    address.district,
    address.province,
    address.department,
  ].filter(Boolean);
  const ubigeo = address.ubigeo ? ` (Ubigeo ${address.ubigeo})` : "";
  const map = address.mapUrl ? ` | Mapa: ${address.mapUrl}` : "";
  return `${parts.join(", ")}${ubigeo}${map}`;
}
