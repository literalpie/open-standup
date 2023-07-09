import { component$ } from "@builder.io/qwik";
import { routeAction$ } from "@builder.io/qwik-city";

export const useIncrementCount = routeAction$(async () => {
  let countThing = 1;
  countThing++;
  return countThing;
});

export default component$(() => {
  // const increment = useIncrementCount();

  return (
    <>
      <section class="p-2 border-2 m-1">{1}</section>
    </>
  );
});
