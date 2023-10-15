import { component$, useStore } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";
import { StandupComponent } from "~/components/standup-component/standup-component";
import { useSyncedStandupState } from "~/hooks/useSyncedStandupState";
import { Person, StandupSeries } from "open-standup-shared";
import { Introduction } from "~/components/introduction/introduction";

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
  const seriesState = useStore<StandupSeries>({
    id: "demo",
    people: initialPeople,
    randomizeOnStart: false,
    title: "Demo Meeting",
  });
  const standupState = useSyncedStandupState(seriesState);
  return (
    <div>
      <Introduction />
      <section class="py-4">
        <h2 class="font-bold text-lg text-center">{seriesState.title}</h2>
        <StandupComponent
          seriesState={seriesState}
          standupState={standupState}
        />
      </section>
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
