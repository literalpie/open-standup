import {
  component$,
  useSignal,
  $,
  useClientEffect$,
  useContext,
} from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { Person } from "~/shared/standup-state.types";
import { standupParticipantsContext } from "~/shared/standup-participants.context";

export default component$(() => {
  const participants = useSignal<Person[]>([]);
  const newPartic = useSignal<string>();
  const navigate = useNavigate();
  const standupState = useContext(standupParticipantsContext);
  const submitNewParticipant = $(() => {
    if (!newPartic.value) {
      return;
    }
    participants.value.push({
      name: newPartic.value,
      id: participants.value.length,
      order: participants.value.length,
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
        const semiRandomNumber = new Date().getTime();
        standupState[semiRandomNumber] = participants.value;
        navigate.path = `/${semiRandomNumber}`;
      }}
    >
      <ul class="participant-list">
        {participants.value.map((partic) => (
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
      <button class="btn self-start" type="submit">
        Create Standup
      </button>
    </form>
  );
});
