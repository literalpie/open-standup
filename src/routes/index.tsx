import { component$, useStore } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";
import { StandupComponent } from "~/components/standup-component/standup-component";
import { useSyncedStandupState } from "~/hooks/useSyncedStandupState";
import { PersonState, StandupState } from "~/shared/standup-state.types";

export const makeInitialPeopleState = (names: string[]): PersonState[] =>
  names.map((name, index) => ({ done: false, name, order: index, id: index }));

const initialPeople = makeInitialPeopleState([
  "Ben",
  "Chaz",
  "Jason",
  "Jerry",
  "Joe",
  "Juana",
  "Luke",
  "Zack",
]);

export const initialStandupState: StandupState = {
  orderPosition: 0,
  people: initialPeople,
  allDone: false,
  standupId: "literalpie-open-standup",
};
export default component$(() => {
  const standupState = useStore(initialStandupState, { recursive: true });
  useSyncedStandupState(standupState);
  return (
    <div>
      <StandupComponent standupState={standupState} />
    </div>
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
