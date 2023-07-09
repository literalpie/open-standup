import { component$, Slot } from "@builder.io/qwik";
import Header from "../components/header/header";
import { useLocation } from "@builder.io/qwik-city";

export default component$(() => {
  const a = useLocation();
  const p2pBanner = a.url.href.includes("p2p") ? "Peer-to-Peer" : undefined;
  return (
    <>
      <Header />
      {p2pBanner ? (
        <div class="w-full bg-slate-100 px-2">{p2pBanner}</div>
      ) : undefined}
      <main class="flex justify-center">
        <section class="flex-grow p-2 max-w-4xl">
          <Slot />
        </section>
      </main>
    </>
  );
});
