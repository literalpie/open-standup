import {
  component$,
  useSignal,
  $,
  useClientEffect$,
  useStore,
} from "@builder.io/qwik";
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
    editingState.people.push({
      name: newPartic.value,
      id: String(editingState.people.length),
      order: editingState.people.length,
    });
    newPartic.value = undefined;
  });
  // If enter is pressed in the new participant input,
  // add the participant to the list instead of submitting the form.
  useClientEffect$(() => {
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
        navigate.path = `/${series.id}`;
      }}
    >
      <div class="form-control self-start">
        <label for="standup-title-input" class="label">
          Title:
        </label>
        <input
          value={editingState.title}
          placeholder="Standup 12/28/2022"
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
          <li key={partic.id}>{partic.name}</li>
        ))}
        {newPartic.value?.length ? (
          <li class="text-opacity-60 text-base-content">{newPartic.value}</li>
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
          class="btn self-end"
          type="button"
          onClick$={submitNewParticipant}
        >
          Add Participant
        </button>
      </span>
      <div class="form-control">
        <label class="label cursor-pointer justify-start gap-2">
          <span class="label-text">Randomize Order On Start</span>
          <input
            class="checkbox"
            type="checkbox"
            checked={editingState.randomizeOnStart}
            onChange$={(changeEv) => {
              editingState.randomizeOnStart = changeEv.target.checked ?? false;
            }}
          />
        </label>
      </div>
      <button class="btn self-start" type="submit">
        Create Standup
      </button>
    </form>
  );
});
