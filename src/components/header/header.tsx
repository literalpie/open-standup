import { component$ } from "@builder.io/qwik";

export default component$(() => {
  return (
    <header class="p-2 border-b-2 sticky top-0 bg-base-100 flex flex-col">
      <h1 class="font-bold text-xl self-center">Open Standup</h1>
    </header>
  );
});
