import { component$, $ } from "@builder.io/qwik";
import { StandupSeries, StandupMeeting, Person } from "~/shared/types";
import { PersonStatus } from "../person-status/person-status";

/* Randomize array in-place using Durstenfeld shuffle algorithm */
export function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

export const hasPersonUpdated = (
  person: Person,
  updates: StandupMeeting["updates"]
) => {
  return updates.some((update) => update.personId === person.id && update.done);
};
export const StandupComponent = component$<{
  standupState: StandupMeeting;
  seriesState: StandupSeries;
}>(({ standupState, seriesState }) => {
  console.log("series people", seriesState.people);
  const currentPerson = seriesState?.people?.find(
    (person) => person.id === standupState.currentlyUpdating
  );

  const setNextOrderPosition = $(() => {
    if (standupState.allDone) {
      return;
    }
    // const sortedPeople =
    //   seriesState.people?.sort((a, b) => a.order - b.order) ?? [];
    const currentlyUpdatingOrderIndex = standupState.order.findIndex(
      (orderId) => orderId === standupState.currentlyUpdating
    );
    // I THINK the order they are shown in isn't the correct sorted order?
    console.log("standup state order", standupState.order);
    const nextAfterCurrent = standupState.order.find((person, index) => {
      console.log(
        "has updated?",
        person,
        hasPersonUpdated(
          seriesState.people.find((p) => p.id === person)!,
          standupState.updates
        )
      );
      return (
        index > currentlyUpdatingOrderIndex &&
        !hasPersonUpdated(
          seriesState.people.find((p) => p.id === person)!,
          standupState.updates
        )
      );
    });
    const firstNotDone = standupState.order.find(
      (person) =>
        !hasPersonUpdated(
          seriesState.people.find((p) => p.id === person)!,
          standupState.updates
        )
    );
    console.log("nextAfterCurrent", nextAfterCurrent, firstNotDone);
    const nextOrderPosition = nextAfterCurrent ?? firstNotDone;
    standupState.currentlyUpdating = nextOrderPosition;
    standupState.allDone = nextOrderPosition === undefined;
  });
  const notStarted =
    standupState.currentlyUpdating === undefined && !standupState.allDone;

  const startNewMeeting = $(() => {
    standupState.allDone = false;
    const shuffledPeople = [...seriesState.people];
    shuffleArray(shuffledPeople);
    const order = shuffledPeople.map((person) => person.id);
    standupState.order = order;

    standupState.currentlyUpdating = order[0];
    standupState.updates = [];
  });
  return (
    <div>
      {standupState.order.map((order) => {
        const person = seriesState.people.find(
          (testPerson) => testPerson.id === order
        )!;
        return (
          <PersonStatus
            key={person.name}
            name={person.name}
            done={hasPersonUpdated(person, standupState.updates)}
            current={person.id === standupState.currentlyUpdating}
          />
        );
      })}
      <div class="pt-3 flex gap-1">
        {standupState.allDone ? (
          <>
            <div class="flex-grow self-center">All Done!</div>
            <button class="btn flex-grow" onClick$={startNewMeeting}>
              Reset
            </button>
          </>
        ) : notStarted ? (
          <>
            <div class="flex-grow self-center">not started</div>
            <button onClick$={startNewMeeting} class="btn flex-grow">
              Start
            </button>
          </>
        ) : (
          <>
            <button
              class="btn flex-grow"
              onClick$={() => {
                if (currentPerson) {
                  standupState.updates = [
                    ...standupState.updates,
                    { done: true, personId: currentPerson.id },
                  ];
                }
                setNextOrderPosition();
              }}
            >
              Next
            </button>
            <button
              class="btn flex-grow btn-outline"
              onClick$={setNextOrderPosition}
            >
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );
});
