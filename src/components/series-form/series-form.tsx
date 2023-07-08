import {
  useVisibleTask$,
  component$,
  useSignal,
  $,
  useStore,
} from '@builder.io/qwik';
import { StandupSeries } from "~/shared/types";
import { useNavigate } from "@builder.io/qwik-city";

export const SeriesForm = component$<{
  series: StandupSeries;
}>(({ series }) => {
  const editingState = useStore<StandupSeries>({
    id: series.id,
    people: [...series.people],
    randomizeOnStart: series.randomizeOnStart,
    title: series.title,
  });
  const newPartic = useSignal<string>();
  const navigate = useNavigate();
  const submitNewParticipant = $(() => {
    if (!newPartic.value) {
      return;
    }
    const maxId =
      editingState.people
        .map((p) => +p.id)
        .sort((id, id2) => id - id2)
        .at(-1) ?? 0;
    editingState.people.push({
      name: newPartic.value,
      id: String(maxId + 1),
      order: editingState.people.length,
    });
    newPartic.value = undefined;
  });
  // If enter is pressed in the new participant input,
  // add the participant to the list instead of submitting the form.
  useVisibleTask$(() => {
    document
      .getElementById("new-participant-input")
      ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitNewParticipant();
        }
      });
  });

  return (
    <form
      class="flex flex-col gap-2"
      preventdefault:submit
      onSubmit$={() => {
        series.id = editingState.id;
        series.people = editingState.people;
        series.randomizeOnStart = editingState.randomizeOnStart;
        series.title = editingState.title;
        // move to parent component?
        navigate(`/${series.id}`);
      }}
    >
      <div class="form-control self-start">
        <label for="standup-title-input" class="label">
          Title:
        </label>
        <input
          value={editingState.title}
          placeholder="Name your standup"
          class="input input-bordered"
          id="standup-title-input"
          onChange$={(changeEv) => {
            editingState.title = changeEv.target.value;
          }}
          type="text"
        />
      </div>
      <ul class="participant-list">
        {editingState.people.map((partic) => (
          <li
            key={partic.id}
            class="p-1 w-1/2 flex justify-between items-center"
          >
            <div>{partic.name}</div>
            <button
              aria-label="Remove participant"
              onClick$={() => {
                editingState.people = editingState.people.filter(
                  (person) => person.id !== partic.id
                );
                // make sure there aren't gaps in the orders
                editingState.people = editingState.people.map((p, index) => ({
                  ...p,
                  order: index,
                }));
              }}
              type="button"
              class="btn btn-xs btn-outline btn-ghost btn-circle border-hidden hover:bg-inherit hover:text-inherit stroke-base-content fill-base-content text-lg font-light"
            >
              X
            </button>
          </li>
        ))}
        {newPartic.value?.length ? (
          <li class="text-opacity-60 text-base-content p-1">
            {newPartic.value}
          </li>
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
            value={newPartic.value}
            onKeyUp$={(ev) =>
              (newPartic.value = (ev.target as HTMLInputElement).value)
            }
          />
        </div>
        <button
          class="btn btn-neutral self-end"
          type="button"
          onClick$={submitNewParticipant}
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
            onChange$={(changeEv) => {
              editingState.randomizeOnStart = changeEv.target.checked ?? false;
            }}
          />
          <span class="label-text">Randomize Order On Start</span>
        </label>
      </div>
      <button class="btn self-start" type="submit">
        Create Standup
      </button>
    </form>
  );
});
