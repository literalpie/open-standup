import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <header
      class="bg-base-100 sticky top-0 flex flex-row justify-between border-b-2 p-2"
    >
      <div class="w-24"></div>
      <h1 class="text-xl font-bold">
        <A href="/">Open Standup</A>
      </h1>
      <div class="w-24"></div>
    </header>
    <main class="flex justify-center">
      <div class="max-w-4xl flex-grow p-2">
        <router-outlet></router-outlet>
      </div>
    </main>
  `,
  styles: [],
})
export class AppComponent {
  title = "open-standup-angular";
}
