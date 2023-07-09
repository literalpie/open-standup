import { component$, $ } from "@builder.io/qwik";
import { useSyncedSeriesState } from "~/hooks/useSyncedSeriesState";
import {
  SeriesForm,
  StandupSeriesNoId,
} from "~/components/series-form/series-form";
import { useNavigate } from "@builder.io/qwik-city";

export default component$(() => {
  const semiRandomId = String(new Date().getTime());
  const navigate = useNavigate();
  const seriesState = useSyncedSeriesState(semiRandomId);
  const onSubmit = $((submitted: StandupSeriesNoId) => {
    seriesState.people = submitted.people;
    seriesState.randomizeOnStart = submitted.randomizeOnStart;
    seriesState.title = submitted.title;
    navigate(`/p2p/${seriesState.id}`);
  });
  return (
    <div>
      <SeriesForm series={seriesState} onSubmit$={onSubmit} />
    </div>
  );
});
