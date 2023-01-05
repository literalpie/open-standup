import { component$, useContext, useStore } from "@builder.io/qwik";
import { DocumentHead, useLocation } from "@builder.io/qwik-city";
import { StandupComponent } from "~/components/standup-component/standup-component";
import { useSyncedStandupState } from "~/hooks/useSyncedStandupState";
import { Person, StandupMeeting } from "~/shared/standup-state.types";
import { standupSeriesContext } from "../../shared/standup-participants.context";

export const makeInitialStandupState = (
  people: Person[],
  id: string
): StandupMeeting => {
  return {
    orderPosition: 0,
    allDone: false,
    seriesId: id,
    people: people.map((pers, index) => ({
      done: false,
      id: index,
      name: pers.name,
      order: index,
    })),
  };
};

export const isStandupState = (
  standup: StandupMeeting | { standupId: StandupMeeting["seriesId"] }
): standup is StandupMeeting => {
  return (standup as StandupMeeting).people !== undefined;
};

export default component$(() => {
  const location = useLocation();
  const standupStates = useContext(standupSeriesContext);
  const peopleForStandupId = standupStates[location.params.standupId];
  const matchingStandup:
    | StandupMeeting
    | { standupId: StandupMeeting["seriesId"] } = peopleForStandupId
    ? makeInitialStandupState(peopleForStandupId, location.params.standupId)
    : { seriesId: location.params.standupId };
  const standupState = useStore(matchingStandup, { recursive: false });
  useSyncedStandupState(standupState);

  return (
    <>
      {isStandupState(standupState) ? (
        <StandupComponent standupState={standupState} />
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
