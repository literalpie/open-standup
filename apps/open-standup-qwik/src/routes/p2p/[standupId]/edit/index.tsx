import { component$, $ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import {
  SeriesForm,
  StandupSeriesNoId,
} from "~/components/series-form/series-form";
import { useSyncedSeriesState } from "~/hooks/useSyncedSeriesState";

export default component$(() => {
  const location = useLocation();
  const seriesState = useSyncedSeriesState(location.params.standupId);
  const navigate = useNavigate();
  const onSubmit = $((submitted: StandupSeriesNoId) => {
    seriesState.people = submitted.people;
    seriesState.randomizeOnStart = submitted.randomizeOnStart;
    seriesState.title = submitted.title;
    navigate(`/p2p/${seriesState.id}`);
  });

  return (
    <div>
      {seriesState.title.length > 0 ? (
        <SeriesForm series={seriesState} onSubmit$={onSubmit} />
      ) : (
        <>
          <div>Loading...</div>
          <div>It's possible this standup does not exist.</div>
        </>
      )}
    </div>
  );
});
