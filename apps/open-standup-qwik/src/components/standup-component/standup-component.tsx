import { component$, $ } from "@builder.io/qwik";
import { StandupSeries, StandupMeeting, Person } from "~/shared/types";
import { PersonStatus } from "../person-status/person-status";

export const hasPersonUpdated = (
  person: Person,
  updates: StandupMeeting["updates"],
) => {
  return updates.some((update) => update.personId === person.id && update.done);
};
export const StandupComponent = component$<{
  standupState: StandupMeeting;
  seriesState: StandupSeries;
}>(({ standupState, seriesState }) => {
  // calculates on every render, but okay because people will never be large
  const currentPerson = seriesState?.people?.find(
    (person) => person.id === standupState.currentlyUpdating,
  );

  const setNextOrderPosition = $(() => {
    if (standupState.allDone) {
      return;
    }
    const sortedPeople =
      seriesState.people?.sort((a, b) => a.order - b.order) ?? [];
    const updatingIndex = sortedPeople.findIndex(
      (person) => person.id === standupState.currentlyUpdating,
    );
    const nextAfterCurrent = sortedPeople.find(
      (person, index) =>
        index > updatingIndex &&
        !hasPersonUpdated(person, standupState.updates),
    );
    const firstNotDone = sortedPeople.find(
      (person) => !hasPersonUpdated(person, standupState.updates),
    );
    const nextOrderPosition = nextAfterCurrent?.order ?? firstNotDone?.order;
    standupState.currentlyUpdating =
      (nextOrderPosition !== undefined && sortedPeople[nextOrderPosition].id) ||
      undefined;
    standupState.allDone = nextOrderPosition === undefined;
  });

  return (
    <div>
      {seriesState?.people?.map((person) => {
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
            <div class="flex-grow">All Done!</div>
            <button
              class="btn btn-neutral flex-grow"
              onClick$={() => {
                standupState.allDone = false;
                const sortedPeople =
                  seriesState.people?.sort((a, b) => a.order - b.order) ?? [];

                standupState.currentlyUpdating = sortedPeople[0].id;
                standupState.updates = [];
              }}
            >
              Reset
            </button>
          </>
        ) : (
          <>
            <button
              class="btn btn-neutral flex-grow"
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
