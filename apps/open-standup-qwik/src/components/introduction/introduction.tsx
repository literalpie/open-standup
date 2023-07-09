import { component$ } from "@builder.io/qwik";
import WelcomeDetails from "./welcome-details.mdx";
import WelcomeDetailsP2P from "./welcome-details-p2p.mdx";
import { Link, useLocation } from "@builder.io/qwik-city";

export const Introduction = component$(() => {
  const location = useLocation();
  const isP2P = location.url.href.includes("p2p");
  return (
    <>
      <h2 class="font-bold text-lg p-1">Welcome!</h2>
      <p>
        This is Open Standup. An app to help teams have quick and simple sync
        meetings.
      </p>
      <p>Play with the demo below, or make your own meeting</p>
      <div class="flex justify-center py-1">
        <Link href="/p2p/new" class="btn btn-neutral w-1/2">
          Create new standup
        </Link>
      </div>
      <details>
        <summary class="cursor-pointer">How does it work?</summary>
        <WelcomeDetails />
        {isP2P ? <WelcomeDetailsP2P /> : undefined}
      </details>
    </>
  );
});
