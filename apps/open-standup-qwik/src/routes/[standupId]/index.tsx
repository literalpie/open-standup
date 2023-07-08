import { component$ } from "@builder.io/qwik";
import { DocumentHead, Link, useLocation } from "@builder.io/qwik-city";
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
          <h2 class="font-bold text-lg text-center meeting-title flex justify-center items-center gap-2">
            <div>{seriesState.title}</div>
            <Link
              class="edit-button btn btn-sm btn-outline"
              href={`/${location.params.standupId}/edit`}
            >
              Edit
            </Link>
          </h2>
          <StandupComponent
            seriesState={seriesState}
            standupState={standupState}
          />
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
