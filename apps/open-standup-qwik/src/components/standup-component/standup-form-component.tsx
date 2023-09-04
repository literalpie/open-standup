import { component$ } from "@builder.io/qwik";
import type { StandupSeries, StandupMeeting, Person } from "~/shared/types";
import { PersonStatus } from "../person-status/person-status";

export const hasPersonUpdated = (
  person: Person,
  updates: StandupMeeting["updates"],
) => {
  return updates.some((update) => update.personId === person.id && update.done);
};

export const StandupFormComponent = component$<{
  standupState: StandupMeeting;
  seriesState: StandupSeries;
}>(({ standupState, seriesState }) => {
  return (
    <div>
      {seriesState?.people
        .sort((a, b) => a.order - b.order)
        ?.map((person) => {
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
            <button class="btn flex-grow btn-neutral" name="Reset">
              Reset
            </button>
          </>
        ) : (
          <>
            <button class="btn flex-grow btn-neutral" name="Next">
              Next
            </button>
            <button class="btn flex-grow btn-outline" name="Skip">
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );
});
