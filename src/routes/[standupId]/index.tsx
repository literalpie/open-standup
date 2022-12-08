import {
  component$,
  $,
  useStylesScoped$,
  useContext,
  useStore,
} from "@builder.io/qwik";
import { DocumentHead, useLocation } from "@builder.io/qwik-city";
import { PersonStatus } from "~/components/person-status/person-status";
import { useSyncedStandupState } from "~/hooks/useSyncedStandupState";
import { Person, PersonState, StandupState } from "~/shared/types";
import styles from "./index.css?inline";
import { standupStatesContext } from "../layout";

export const makeInitialStandupState = (
  people: Person[],
  id: string
): StandupState => {
  return {
    ...initialStandupState,
    standupId: id,
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
  const location = useLocation();
  const standupStates = useContext(standupStatesContext);
  const peopleForStandupId = standupStates[location.params.standupId];
  console.log(
    "people for this ID",
    standupStates,
    location.params.standupId,
    peopleForStandupId
  );
  const thisStandup: Partial<StandupState> = peopleForStandupId
    ? makeInitialStandupState(peopleForStandupId, location.params.standupId)
    : { standupId: location.params.standupId };
  const standupState = useStore(thisStandup, { recursive: true });
  useStylesScoped$(styles);
  useSyncedStandupState(standupState);
  // calculates on every render, but okay because people will never be large
  const currentPerson = standupState.people?.find(
    (person) => person.order === standupState.orderPosition
  );

  const setNextOrderPosition = $(() => {
    if (standupState.allDone) {
      return;
    }
    const sortedPeople =
      standupState.people?.sort((a, b) => a.order - b.order) ?? [];
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
      {standupState.people?.map((person) => {
        return (
          <PersonStatus
            key={person.name}
            name={person.name}
            done={person.done}
            current={person.order === standupState.orderPosition}
          />
        );
      })}
      <div class="button-container">
        {standupState.allDone ? (
          <>
            <div class="flex-grow">All Done!</div>
            <button
              class="flex-grow"
              onClick$={() => {
                standupState.allDone = initialStandupState.allDone;
                standupState.orderPosition = initialStandupState.orderPosition;
                standupState.people?.forEach((person) => (person.done = false));
              }}
            >
              Reset
            </button>
          </>
        ) : (
          <>
            <button
              class="flex-grow"
              onClick$={() => {
                if (currentPerson) {
                  currentPerson.done = true;
                }
                setNextOrderPosition();
              }}
            >
              Next
            </button>
            <button class="flex-grow" onClick$={setNextOrderPosition}>
              Skip
            </button>
          </>
        )}
      </div>
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
