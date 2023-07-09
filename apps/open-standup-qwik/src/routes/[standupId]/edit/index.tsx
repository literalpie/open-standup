import { component$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { SeriesForm } from "~/components/series-form/series-form";
import { useSaveStandupSeries } from "~/server-helpers/save-standup-series";

import { useStandupSeries } from "..";

export default component$(() => {
  const seriesState = useStandupSeries();
  const submitSeries = useSaveStandupSeries();
  const nav = useNavigate();
  return (
    <div>
      <SeriesForm
        series={seriesState.value}
        onSubmit$={async (series) => {
          const newId = await submitSeries.submit({
            ...series,
            id: seriesState.value.id,
          });
          nav(`/${newId.value}`);
        }}
      />
    </div>
  );
});
