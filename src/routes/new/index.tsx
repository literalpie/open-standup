import {
  component$,
  useSignal,
  useStylesScoped$,
  $,
  useClientEffect$,
  useContext,
} from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { Person } from "~/shared/standup-state.types";
import { standupParticipantsContext } from "../../shared/standup-participants.context";
import styles from "./index.css?inline";

export default component$(() => {
  useStylesScoped$(styles);
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
          <li class="new-participant">{newPartic.value}</li>
        ) : null}
      </ul>
      <span class="new-participant-form-row">
        <label>
          New Participant:
          <input
            id="new-participant-input"
            type="text"
            value={newPartic.value}
            onKeyUp$={(ev) =>
              (newPartic.value = (ev.target as HTMLInputElement).value)
            }
          />
        </label>
        <button type="button" onClick$={submitNewParticipant}>
          Add Participant
        </button>
      </span>
      <button type="submit">Create Standup</button>
    </form>
  );
});
