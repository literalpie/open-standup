import { component$, useSignal } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { SeriesForm } from "~/components/series-form/series-form";
import { useSaveStandupSeries } from "~/server-helpers/save-standup-series";

export default component$(() => {
  const submitSeries = useSaveStandupSeries();
  const nav = useNavigate();
  const createdId = useSignal<string | undefined>();
  return (
    <div>
      {createdId.value !== undefined ? (
        <>
          <p>
            The standup has been created, but it doesn't always navigate right.
          </p>
          <a class="link" href={`/${createdId.value}`}>
            Click Here
          </a>
        </>
      ) : (
        <SeriesForm
          onSubmit$={async (series) => {
            createdId.value = (await submitSeries.submit(series))
              .value as unknown as string;
            if (createdId.value !== undefined) {
              await nav(`/${createdId.value}`);
            }
          }}
        />
      )}
    </div>
  );
});
