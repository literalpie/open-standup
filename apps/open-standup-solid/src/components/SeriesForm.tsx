import { For, createMemo, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import type { StandupSeries } from "~/shared/types";

export type StandupSeriesNoId = Omit<StandupSeries, "id">;

export function SeriesForm(props: {
  initialSeries: StandupSeriesNoId | undefined;
  onSubmit: (series: StandupSeriesNoId) => void;
}) {
  const [editingState, setEditingState] = createStore<StandupSeriesNoId>({
    people: [...(props.initialSeries?.people ?? [])],
    randomizeOnStart: props.initialSeries?.randomizeOnStart ?? false,
    title: props.initialSeries?.title ?? "",
  });
  const isEditing = createMemo(() => props.initialSeries !== undefined);
  const [newPartic, setNewPartic] = createSignal<string>();
  const submitNewParticipant = () => {
    if (!newPartic()) {
      return;
    }
    const maxId =
      editingState.people
        .map((p) => +p.id)
        .sort((id, id2) => id - id2)
        .at(-1) ?? 0;
    setEditingState("people", (old) => [
      ...old,
      {
        name: newPartic()!,
        id: String(maxId + 1),
        order: editingState.people.length,
      },
    ]);
    setNewPartic(undefined);
  };

  return (
    <form
      class="flex flex-col gap-2"
      onSubmit={(event) => {
        // don't refresh the page
        event.preventDefault();
        props.onSubmit(editingState);
      }}
    >
      <div class="form-control self-start">
        <label for="standup-title-input" class="label">
          Title:
        </label>
        <input
          value={editingState.title ?? ""}
          placeholder="Name your standup"
          class="input input-bordered"
          id="standup-title-input"
          onChange={(changeEv) => {
            setEditingState("title", changeEv.target.value);
          }}
          type="text"
        />
      </div>
      <ul class="participant-list">
        <For each={editingState.people}>
          {(partic) => (
            <li class="p-1 w-1/2 flex justify-between items-center">
              <div>{partic.name}</div>
              <button
                aria-label="Remove participant"
                onClick={() => {
                  setEditingState("people", (old) =>
                    old.filter((person) => person.id !== partic.id),
                  );
                  // make sure there aren't gaps in the orders
                  setEditingState("people", (old) =>
                    old.map((p, index) => ({
                      ...p,
                      order: index,
                    })),
                  );
                }}
                type="button"
                class="btn btn-xs btn-outline btn-ghost btn-circle border-hidden hover:bg-inherit hover:text-inherit stroke-base-content fill-base-content text-lg font-light"
              >
                X
              </button>
            </li>
          )}
        </For>
        {newPartic()?.length ? (
          <li class="text-opacity-60 text-base-content p-1">{newPartic()}</li>
        ) : null}
      </ul>
      <span class="flex gap-2 align">
        <div class="form-control">
          <label for="new-participant-input" class="label">
            New Participant:
          </label>
          <input
            class="input input-bordered "
            id="new-participant-input"
            type="text"
            value={newPartic() ?? ""}
            onKeyDown={(ev) => {
              // if they hit enter, add the new participant instead of submitting the form
              if (ev.key === "Enter") {
                ev.preventDefault();
                submitNewParticipant();
              }
            }}
            onKeyUp={(ev) =>
              setNewPartic((ev.target as HTMLInputElement).value)
            }
          />
        </div>
        <button
          class="btn self-end"
          type="button"
          onClick={submitNewParticipant}
        >
          Add Participant
        </button>
      </span>
      <div class="form-control">
        <label class="label cursor-pointer justify-start gap-2">
          <input
            class="checkbox"
            type="checkbox"
            checked={editingState.randomizeOnStart}
            onChange={(changeEv) => {
              setEditingState(
                "randomizeOnStart",
                changeEv.target.checked ?? false,
              );
            }}
          />
          <span class="label-text">Randomize Order On Start</span>
        </label>
      </div>
      <button class="btn self-start" type="submit">
        {isEditing() ? "Update Standup" : "Create Standup"}
      </button>
      {isEditing() && (
        <p class="font-light m-0">
          Updating a standup meeting will reset the state of the in-progress
          meeting.
        </p>
      )}
    </form>
  );
}
