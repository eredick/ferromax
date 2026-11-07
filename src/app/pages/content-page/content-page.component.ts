import { Component, inject, signal } from "@angular/core";
import { NgOptimizedImage } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { NotificationService } from "../../core/notification.service";
import { SELLER_EMAIL, WHATSAPP_PHONE_NUMBER } from "../../config/catalog.config";
import { PedidoService } from "../../services/pedido.service";
import { PageHeaderComponent } from "../../shared/page-header.component";

type ContentPage = "nosotros" | "tiendas" | "servicios" | "blog" | "contacto";

const stores = [
  { name: "Sede Central", address: "Av. Principal 1234, Lima", phone: "(01) 555-0101" },
  { name: "Sede Norte", address: "Av. Industrial 456, Los Olivos", phone: "(01) 555-0102" },
  {
    name: "Sede Sur",
    address: "Av. Los Héroes 789, San Juan de Miraflores",
    phone: "(01) 555-0103",
  },
  { name: "Sede Este", address: "Carretera Central km 5, Ate", phone: "(01) 555-0104" },
];

const services = [
  {
    icon: "↗",
    title: "Delivery a obra",
    text: "Llevamos tus materiales hasta tu obra o domicilio.",
  },
  { icon: "✂", title: "Corte de melamina y vidrio", text: "Cortes a medida con precisión." },
  { icon: "◉", title: "Preparación de pintura", text: "Igualamos el color que necesites." },
  { icon: "⌘", title: "Duplicado de llaves", text: "Rápido y garantizado." },
  { icon: "⚒", title: "Alquiler de herramientas", text: "Equipos profesionales por día o semana." },
  { icon: "▣", title: "Asesoría técnica", text: "Expertos que te ayudan a elegir lo correcto." },
];

const posts = [
  {
    image: "/assets/slide3.jpg",
    category: "Pintura",
    title: "Cómo elegir la pintura ideal para cada ambiente",
    date: "12 oct 2026",
  },
  {
    image: "/assets/slide2.jpg",
    category: "Herramientas",
    title: "5 herramientas eléctricas que todo hogar necesita",
    date: "3 oct 2026",
  },
  {
    image: "/assets/slide1.jpg",
    category: "Consejos",
    title: "Guía para planificar una remodelación sin estrés",
    date: "24 set 2026",
  },
];

const whatsappUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;

@Component({
  selector: "app-content-page",
  standalone: true,
  imports: [NgOptimizedImage, PageHeaderComponent],
  templateUrl: "./content-page.component.html",
})
export class ContentPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  private readonly pedidoService = inject(PedidoService);

  readonly sellerEmail = SELLER_EMAIL;
  readonly sendingContact = signal(false);
  readonly page = this.route.snapshot.data["page"] as ContentPage;
  readonly stores = stores;
  readonly services = services;
  readonly posts = posts;
  readonly values = [
    {
      title: "Misión",
      description: "Brindar productos de calidad a precios justos con asesoría honesta.",
    },
    {
      title: "Visión",
      description: "Ser la ferretería de confianza de cada hogar y obra de la región.",
    },
    { title: "Valores", description: "Compromiso, cercanía, calidad y responsabilidad." },
  ];
  readonly stats = [
    { value: "20+", label: "Años" },
    { value: "5,000+", label: "Productos" },
    { value: "4", label: "Tiendas" },
    { value: "50k", label: "Clientes" },
  ];

  waLink(message: string): string {
    return whatsappUrl(message);
  }

  async submitContact(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) return;

    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    this.sendingContact.set(true);
    try {
      const response = await firstValueFrom(
        this.pedidoService.enviarContacto({
          tipo: "contacto",
          destinatario: SELLER_EMAIL,
          nombre: name,
          correo: email,
          mensaje: message,
        }),
      );
      if (response.status !== "success") throw new Error("El script rechazó la solicitud.");
      this.notifications.success("Mensaje enviado. Te responderemos pronto.");
      form.reset();
    } catch (error) {
      console.error("No se pudo enviar el mensaje de contacto.", error);
      this.notifications.error(
        "No se pudo enviar el mensaje.",
        `Inténtalo de nuevo o escribe a ${SELLER_EMAIL}.`,
      );
    } finally {
      this.sendingContact.set(false);
    }
  }
}
