import { component$, useContext, useStore } from "@builder.io/qwik";
import { DocumentHead, useLocation } from "@builder.io/qwik-city";
import { StandupComponent } from "~/components/standup-component/standup-component";
import { useSyncedStandupState } from "~/hooks/useSyncedStandupState";
import { Person, StandupState } from "~/shared/standup-state.types";
import { standupParticipantsContext } from "../../shared/standup-participants.context";

export const makeInitialStandupState = (
  people: Person[],
  id: string
): StandupState => {
  return {
    orderPosition: 0,
    allDone: false,
    standupId: id,
    people: people.map((pers, index) => ({
      done: false,
      id: index,
      name: pers.name,
      order: index,
    })),
  };
};

export const isStandupState = (
  standup: StandupState | { standupId: StandupState["standupId"] }
): standup is StandupState => {
  return (standup as StandupState).people !== undefined;
};

export default component$(() => {
  const location = useLocation();
  const standupStates = useContext(standupParticipantsContext);
  const peopleForStandupId = standupStates[location.params.standupId];
  const matchingStandup:
    | StandupState
    | { standupId: StandupState["standupId"] } = peopleForStandupId
    ? makeInitialStandupState(peopleForStandupId, location.params.standupId)
    : { standupId: location.params.standupId };
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
