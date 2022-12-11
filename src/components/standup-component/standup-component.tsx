import { component$, useStylesScoped$, $ } from "@builder.io/qwik";
import { initialStandupState } from "~/routes";
import { StandupState } from "~/shared/standup-state.types";
import { PersonStatus } from "../person-status/person-status";
import styles from "./standup-component.css?inline";

export const StandupComponent = component$<{ standupState: StandupState }>(
  ({ standupState }) => {
    useStylesScoped$(styles);
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
                  standupState.orderPosition =
                    initialStandupState.orderPosition;
                  standupState.people?.forEach(
                    (person) => (person.done = false)
                  );
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
  }
);