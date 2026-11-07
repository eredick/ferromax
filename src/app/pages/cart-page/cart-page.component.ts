import { isPlatformBrowser } from "@angular/common";
import { Component, computed, inject, PLATFORM_ID, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";

import {
  calcShipping,
  formatPrice,
  PAYMENT_METHODS,
  paymentLabels,
  type PaymentMethod,
} from "../../../../shared/products";
import { CartService } from "../../services/cart.service";
import { PedidoService, type PedidoPayload } from "../../services/pedido.service";
import { UbigeoService } from "../../services/ubigeo.service";
import { ReverseGeocodeService } from "../../services/reverse-geocode.service";
import { matchUbigeo, streetFromAddress } from "../../core/ubigeo-match";
import { formatDeliveryAddress, type DeliveryAddress } from "../../core/delivery-address";
import { CartComponent } from "../../components/cart/cart.component";
import { FilterSelectComponent } from "../../shared/filter-select.component";
import { NotificationService } from "../../core/notification.service";

@Component({
  selector: "app-cart-page",
  standalone: true,
  imports: [RouterLink, CartComponent, FilterSelectComponent],
  templateUrl: "./cart-page.component.html",
})
export class CartPageComponent {
  readonly paymentMethods = PAYMENT_METHODS;
  readonly paymentLabels = paymentLabels;
  readonly payment = signal<PaymentMethod>("contraentrega");
  readonly sending = signal(false);
  readonly orderCode = signal<string | null>(null);
  readonly orderWhatsappUrl = signal<string | null>(null);
  readonly emailSent = signal(false);
  readonly emailError = signal<string | null>(null);
  readonly shipping = computed(() => calcShipping(this.cart.total()));
  readonly formatPrice = formatPrice;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly ubigeo = inject(UbigeoService);
  private readonly geocoder = inject(ReverseGeocodeService);
  readonly departments = this.ubigeo.departments;
  readonly ubigeoFailed = this.ubigeo.loadFailed;
  readonly departmentCode = signal("");
  readonly provinceCode = signal("");
  readonly districtCode = signal("");
  readonly provinces = computed(
    () => this.departments().find((item) => item.code === this.departmentCode())?.provinces ?? [],
  );
  readonly districts = computed(
    () => this.provinces().find((item) => item.code === this.provinceCode())?.districts ?? [],
  );
  readonly address = signal("");
  readonly noNumber = signal(false);
  readonly apartment = signal("");
  readonly mapUrl = signal<string | null>(null);
  readonly locating = signal(false);
  readonly locationError = signal<string | null>(null);

  constructor(
    readonly cart: CartService,
    private readonly pedidoService: PedidoService,
    private readonly notifications: NotificationService,
  ) {
    this.ubigeo.load();
  }

  readonly departmentNames = computed(() => this.departments().map((item) => item.name));
  readonly provinceNames = computed(() => this.provinces().map((item) => item.name));
  readonly districtNames = computed(() => this.districts().map((item) => item.name));
  readonly departmentName = computed(
    () => this.departments().find((item) => item.code === this.departmentCode())?.name ?? null,
  );
  readonly provinceName = computed(
    () => this.provinces().find((item) => item.code === this.provinceCode())?.name ?? null,
  );
  readonly districtName = computed(
    () => this.districts().find((item) => item.code === this.districtCode())?.name ?? null,
  );

  pickDepartment(name: string | null): void {
    this.departmentCode.set(this.departments().find((item) => item.name === name)?.code ?? "");
    this.provinceCode.set("");
    this.districtCode.set("");
  }

  pickProvince(name: string | null): void {
    this.provinceCode.set(this.provinces().find((item) => item.name === name)?.code ?? "");
    this.districtCode.set("");
  }

  pickDistrict(name: string | null): void {
    this.districtCode.set(this.districts().find((item) => item.name === name)?.code ?? "");
  }

  onAddressInput(event: Event): void {
    this.address.set((event.target as HTMLInputElement).value);
  }

  onApartmentInput(event: Event): void {
    this.apartment.set((event.target as HTMLInputElement).value);
  }

  onNoNumberChange(event: Event): void {
    this.noNumber.set((event.target as HTMLInputElement).checked);
  }

  useCurrentLocation(): void {
    if (!this.isBrowser || !("geolocation" in navigator)) {
      this.locationError.set("Tu navegador no permite obtener la ubicación.");
      return;
    }
    this.locating.set(true);
    this.locationError.set(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => void this.onPosition(coords.latitude, coords.longitude),
      (error) => {
        this.locating.set(false);
        this.locationError.set(
          error.code === error.PERMISSION_DENIED
            ? "Permiso de ubicación denegado. Escribe tu dirección manualmente."
            : "No se pudo obtener tu ubicación. Escribe tu dirección manualmente.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  clearLocation(): void {
    this.mapUrl.set(null);
    this.address.set("");
    this.noNumber.set(false);
    this.apartment.set("");
    this.departmentCode.set("");
    this.provinceCode.set("");
    this.districtCode.set("");
    this.locationError.set(null);
  }

  private async onPosition(lat: number, lon: number): Promise<void> {
    this.mapUrl.set(`https://maps.google.com/?q=${lat.toFixed(6)},${lon.toFixed(6)}`);
    try {
      const geo = await this.geocoder.reverse(lat, lon);
      if (geo) {
        const street = streetFromAddress(geo);
        if (street) this.address.set(street);
        else if (!this.address().trim()) this.address.set("Ubicación actual (ver enlace de mapa)");
        const match = matchUbigeo(this.departments(), geo);
        if (match) {
          this.departmentCode.set(match.departmentCode);
          this.provinceCode.set(match.provinceCode);
          this.districtCode.set(match.districtCode);
        } else {
          this.locationError.set("No pudimos detectar el distrito. Selecciónalo manualmente.");
        }
      }
    } catch {
      if (!this.address().trim()) this.address.set("Ubicación actual (ver enlace de mapa)");
      this.locationError.set(
        "Guardamos tu ubicación, pero no pudimos detectar la dirección. Complétala manualmente.",
      );
    } finally {
      this.locating.set(false);
    }
  }

  async submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (this.sending() || this.cart.lines().length === 0) return;

    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) return;
    if (!this.departmentCode() || !this.provinceCode() || !this.districtCode()) {
      this.notifications.error("Selecciona departamento, provincia y distrito.");
      return;
    }
    const formData = new FormData(form);
    const department = this.departments().find((item) => item.code === this.departmentCode());
    const province = this.provinces().find((item) => item.code === this.provinceCode());
    const district = this.districts().find((item) => item.code === this.districtCode());
    const delivery: DeliveryAddress = {
      street: this.address(),
      noNumber: this.noNumber(),
      apartment: String(formData.get("apartment") ?? ""),
      department: department?.name ?? "",
      province: province?.name ?? "",
      district: district?.name ?? "",
      ubigeo: district?.code ?? "",
      mapUrl: this.mapUrl(),
    };
    const contact = {
      name: String(formData.get("name")),
      phone: String(formData.get("phone")),
      email: String(formData.get("email")),
      address: formatDeliveryAddress(delivery),
    };

    this.sending.set(true);
    try {
      const code = `FX-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
      const payload: PedidoPayload = {
        cliente: {
          nombre: contact.name,
          telefono: contact.phone,
          direccion: contact.address,
          departamento: delivery.department,
          provincia: delivery.province,
          distrito: delivery.district,
          ubigeo: delivery.ubigeo,
          interior: delivery.apartment.trim(),
          sinNumero: delivery.noNumber,
          ubicacionUrl: delivery.mapUrl ?? "",
        },
        formaPago: paymentLabels[this.payment()],
        items: this.cart.lines().map((line) => ({
          nombre: line.product.name,
          cantidad: line.qty,
          precioUnitario: line.product.price,
          subtotal: line.product.price * line.qty,
        })),
        total: this.cart.total() + this.shipping(),
      };

      this.orderWhatsappUrl.set(
        this.cart.orderWhatsappUrl(contact, code, paymentLabels[this.payment()]),
      );
      const response = await firstValueFrom(this.pedidoService.enviarPedido(payload));
      if (response.status !== "success") {
        throw new Error("La aplicación de pedidos rechazó la solicitud.");
      }

      this.emailSent.set(true);
      this.emailError.set(null);
      this.cart.clear();
      this.orderCode.set(code);
      this.notifications.success("Pedido enviado correctamente.");
    } catch (error) {
      console.error("No se pudo enviar el pedido.", error);
      this.emailSent.set(false);
      this.emailError.set(
        "No se pudo enviar el pedido. El carrito se conserva para que puedas intentarlo otra vez.",
      );
      this.notifications.error("No se pudo enviar el pedido. Inténtalo otra vez.");
    } finally {
      this.sending.set(false);
    }
  }
}
