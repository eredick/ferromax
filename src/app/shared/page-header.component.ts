import { Component, input } from "@angular/core";

@Component({
  selector: "app-page-header",
  standalone: true,
  templateUrl: "./page-header.component.html",
})
export class PageHeaderComponent {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input("");
  readonly compact = input(true);
}
