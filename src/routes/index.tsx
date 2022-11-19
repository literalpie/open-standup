import { component$, useStore, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { PersonStatus } from "~/components/person-status/PersonStatus";
import { PersonState, StandupState } from "~/shared/types";

const makeInitialPeopleState = (names: string[]): PersonState[] =>
  names.map((name, index) => ({ done: false, name, order: index }));
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
};

export default component$(() => {
  const standupState = useStore(initialStandupState, { recursive: true });
  // calculates on every render, but okay because people will never be large
  const currentPerson = standupState.people.find(
    (person) => person.order === standupState.orderPosition
  );

  const setNextOrderPosition = $(() => {
    if (standupState.allDone) {
      return;
    }
    const sortedPeople = standupState.people.sort((a, b) => a.order - b.order);
    const nextAfterCurrent = sortedPeople.find(
      (person, index) =>
        standupState.orderPosition !== undefined &&
        index > standupState.orderPosition &&
        !person.done
    );
    const firstNotDone = sortedPeople.find((person) => !person.done);
    const nextOrderPosition = nextAfterCurrent?.order ?? firstNotDone?.order;
    standupState.orderPosition = nextOrderPosition;
    standupState.allDone = nextOrderPosition === undefined;
  });

  return (
    <div>
      {standupState.people.map((person) => {
        return (
          <PersonStatus
            name={person.name}
            done={person.done}
            current={person.order === standupState.orderPosition}
          />
        );
      })}
      {standupState.allDone ? (
        <>
          All Done!
          <button
            onClick$={() => {
              standupState.allDone = initialStandupState.allDone;
              standupState.orderPosition = initialStandupState.orderPosition;
              standupState.people.forEach((person) => (person.done = false));
            }}
          >
            Reset
          </button>
        </>
      ) : (
        <>
          <button
            onClick$={() => {
              if (currentPerson) {
                currentPerson.done = true;
              }
              setNextOrderPosition();
            }}
          >
            Next
          </button>
          <button onClick$={setNextOrderPosition}>Skip</button>
        </>
      )}
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
