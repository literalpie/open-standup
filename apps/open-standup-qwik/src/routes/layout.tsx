import { component$, Slot } from "@builder.io/qwik";
import Header from "../components/header/header";

export default component$(() => {
  return (
    <>
      <Header />
      <main class="flex justify-center">
        <section class="flex-grow p-2 max-w-4xl">
          <Slot />
        </section>
      </main>
    </>
  );
});
