import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <!--The content below is only a placeholder and can be replaced.-->
    <div style="text-align:center " class="text-3xl font-bold underline">
      test
    </div>
    <h2>Here are some links to help you start:</h2>
    <ul>
      <li>
        <h2>
          <a target="_blank" rel="noopener" href="https://angular.io/tutorial"
            >Tour of Heroes</a
          >
        </h2>
      </li>
      <li>
        <h2>
          <a target="_blank" rel="noopener" href="https://angular.io/cli"
            >CLI Documentation</a
          >
        </h2>
      </li>
      <li>
        <h2>
          <a target="_blank" rel="noopener" href="https://blog.angular.io/"
            >Angular blog</a
          >
        </h2>
      </li>
    </ul>
    <router-outlet></router-outlet>
  `,
  styles: [],
})
export class AppComponent {
  title = "open-standup-angular";
}
