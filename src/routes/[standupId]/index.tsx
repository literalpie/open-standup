import { component$ } from "@builder.io/qwik";
import { DocumentHead, useLocation } from "@builder.io/qwik-city";
import { StandupComponent } from "~/components/standup-component/standup-component";
import { useSyncedSeriesState } from "~/hooks/useSyncedSeriesState";
import { useSyncedStandupState } from "~/hooks/useSyncedStandupState";

export default component$(() => {
  const location = useLocation();
  const seriesState = useSyncedSeriesState(location.params.standupId);
  const standupState = useSyncedStandupState(seriesState);

  return (
    <>
      {seriesState && seriesState.people.length > 0 ? (
        <div>
          title: {seriesState.title}
          <StandupComponent seriesState={seriesState} standupState={standupState} />

        </div>
      ) : (
        <div>Standup Not Found</div>
      )}
    </>
  );
});

export const head: DocumentHead = {
  title: "Open Standup",
  meta: [
    {
      name: "name",
      content: "description",
    },
  ],
};
