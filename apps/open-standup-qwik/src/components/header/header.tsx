import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <header class="bg-base-100 sticky top-0 flex flex-col border-b-2 p-2">
      <h1 class="self-center text-xl font-bold">
        <Link href="/">Open Standup</Link>
      </h1>
    </header>
  );
});
