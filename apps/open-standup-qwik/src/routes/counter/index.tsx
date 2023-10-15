import {
  component$,
  useSignal,
  useVisibleTask$,
  useComputed$,
} from "@builder.io/qwik";
import { routeAction$, server$ } from "@builder.io/qwik-city";

import { routeLoader$ } from "@builder.io/qwik-city";
import { getSbClient } from "~/server-helpers/get-sb-client";

export const getCounter = server$(async function () {
  const sbClient = await getSbClient(this);
  const res = await sbClient.from("counter").select("*").single();
  return res;
});

export const useCountLoader = routeLoader$(async () => {
  return getCounter();
});

export const useIncrementCount = routeAction$(async (_, requestEv) => {
  const sharedDb = await getSbClient(requestEv);

  const current = (await sharedDb.from("counter").select("*").single()).data;
  if (current && current.counter) {
    const res = await sharedDb
      .from("counter")
      .update({
        counter: current.counter + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.id);
    return res;
  }
  return undefined;
});

export const usePollingCount = () => {
  const loaderCount = useCountLoader();
  const num = useSignal(loaderCount.value);
  const lastUpdated = useSignal(new Date());

  useVisibleTask$(async ({ cleanup }) => {
    // allows us to stop polling when the component is unmounted
    let keepListening = true;

    cleanup(() => (keepListening = false));
    while (keepListening) {
      const dueForUnfocusedUpdate =
        new Date().getTime() - lastUpdated.value.getTime() > 20_000;
      if (
        document.visibilityState === "visible" &&
        (document.hasFocus() || dueForUnfocusedUpdate)
      ) {
        const newCounter = await getCounter();
        num.value = newCounter;
        lastUpdated.value = new Date();
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  });
  const numValue = useComputed$(() => {
    // get the most updated value. the loader will be most up-to-date if this instance made a change.
    const loaderCountDate = new Date(loaderCount.value.data?.updated_at ?? 0);
    const pollingCount = new Date(num.value.data?.updated_at ?? 0);
    return loaderCountDate > pollingCount ? loaderCount.value : num.value;
  });
  return numValue;
};

export default component$(() => {
  const increment = useIncrementCount();
  const numValue = usePollingCount();

  return (
    <>
      <section class="p-2 border-2 m-1">
        {numValue.value.data ? (
          <p>The number is {numValue.value.data?.counter}</p>
        ) : undefined}
        {numValue.value.error ? (
          <>There was an error: {numValue.value.error.message}</>
        ) : undefined}
      </section>
      <button class="btn" onClick$={() => increment.submit()}>
        increment
      </button>
    </>
  );
});
