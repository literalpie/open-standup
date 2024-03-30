import { component$ } from "@builder.io/qwik";
import type {
  StandupSeries,
  StandupMeeting,
  Person,
} from "open-standup-shared";
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
      <div class="flex gap-1 pt-3">
        {standupState.allDone ? (
          <>
            <div class="flex-grow">All Done!</div>
            <button class="btn btn-neutral flex-grow" name="Reset">
              Reset
            </button>
          </>
        ) : (
          <>
            <button class="btn btn-neutral flex-grow" name="Next">
              Next
            </button>
            <button class="btn btn-outline flex-grow" name="Skip">
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );
});
