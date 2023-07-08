import { component$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { SeriesForm } from "~/components/series-form/series-form";
import { useSyncedSeriesState } from "~/hooks/useSyncedSeriesState";

export default component$(() => {
  const location = useLocation();
  const seriesState = useSyncedSeriesState(location.params.standupId);
  return (
    <div>
      {seriesState.title.length > 0 ? (
        <SeriesForm series={seriesState} />
      ) : (
        <>
          <div>Loading...</div>
          <div>It's possible this standup does not exist.</div>
        </>
      )}
    </div>
  );
});
