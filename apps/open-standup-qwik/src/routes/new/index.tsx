import { component$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { SeriesForm } from "~/components/series-form/series-form";
import { useSaveStandupSeries } from "~/server-helpers/save-standup-series";

export default component$(() => {
  const submitSeries = useSaveStandupSeries();
  const nav = useNavigate();
  return (
    <div>
      <SeriesForm
        onSubmit$={async (series) => {
          const createdId = await submitSeries.submit(series);
          if (createdId !== undefined) {
            await nav(`/${createdId.value}`);
          }
        }}
      />
    </div>
  );
});
