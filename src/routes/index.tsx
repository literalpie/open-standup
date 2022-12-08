import { component$ } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";
import { Person, PersonState, StandupState } from "~/shared/types";

export const makeInitialStandupState = (people: Person[]): StandupState => {
  return {
    ...initialStandupState,
    people: people.map((pers, index) => ({
      done: false,
      id: index,
      name: pers.name,
      order: index,
    })),
  };
};
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
  return <>Hello world</>;
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
