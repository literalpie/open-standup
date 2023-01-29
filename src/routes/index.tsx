import { component$, useStore } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";
import { StandupComponent } from "~/components/standup-component/standup-component";
import { useSyncedStandupState } from "~/hooks/useSyncedStandupState";
import { Person, StandupSeries } from "~/shared/types";

export const makeInitialPeopleState = (names: string[]): Person[] =>
  names.map((name, index) => ({ name, order: index, id: String(index) }));

export const initialPeople = makeInitialPeopleState([
  "Ben",
  "Chaz",
  "Jason",
  "Jerry",
  "Joe",
  "Juana",
  "Luke",
  "Zack",
]);

export default component$(() => {
  const seriesState = useStore<StandupSeries>({id: '0', people:initialPeople, randomizeOnStart: false, title: 'Demo'});
  const standupState = useSyncedStandupState(seriesState);
  return (
    <div>
      <StandupComponent seriesState={seriesState} standupState={standupState} />
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
