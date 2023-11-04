import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <header
      class="p-2 border-b-2 sticky top-0 bg-base-100 flex flex-row justify-between"
    >
      <div class="w-24"></div>
      <h1 class="font-bold text-xl">
        <A href="/">Open Standup</A>
      </h1>
      <div class="w-24"></div>
    </header>
    <main class="flex justify-center">
      <div class="flex-grow p-2 max-w-4xl">
        <router-outlet></router-outlet>
      </div>
    </main>
  `,
  styles: [],
})
export class AppComponent {
  title = "open-standup-angular";
}
