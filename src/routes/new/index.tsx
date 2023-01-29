import { component$ } from "@builder.io/qwik";
import { useSyncedSeriesState } from "~/hooks/useSyncedSeriesState";
import { SeriesForm } from "~/components/series-form/series-form";

export default component$(() => {
  const semiRandomId = String(new Date().getTime());
  const seriesState = useSyncedSeriesState(semiRandomId);

  return (
    <div>
      <SeriesForm series={seriesState} />
    </div>
  );
});
