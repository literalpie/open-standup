import { For, createMemo, createSignal } from "solid-js";
import { DragDropProvider } from "@dnd-kit/solid";
import { useSortable } from "@dnd-kit/solid/sortable";
import { move } from "@dnd-kit/helpers";

interface Person {
  id: string;
  name: string;
  order: number;
}

interface StandupSeries {
  id: string;
  title: string;
  people: Person[];
  randomizeOnStart: boolean;
}

export type StandupSeriesNoId = Omit<StandupSeries, "id">;

function SortableItem(props: {
  id: string;
  index: number;
  name: string;
  onRemove: () => void;
}) {
  const { ref, isDragging } = useSortable({
    id: props.id,
    index: props.index,
  });

  return (
    <li
      ref={ref}
      class="flex w-1/2 items-center justify-between p-1"
      style={{ opacity: isDragging() ? 0.5 : 1 }}
    >
      <div class="flex items-center gap-2">
        <span class="cursor-grab">⠿</span>
        <span>{props.name}</span>
      </div>
      <button
        aria-label="Remove participant"
        onClick={props.onRemove}
        type="button"
        class="btn btn-xs btn-outline btn-ghost btn-circle stroke-base-content fill-base-content border-hidden text-lg font-light hover:bg-inherit hover:text-inherit"
      >
        X
      </button>
    </li>
  );
}

export function SeriesForm(props: {
  initialSeries?: StandupSeriesNoId;
  onSubmit: (series: StandupSeriesNoId) => void;
}) {
  const [title, setTitle] = createSignal(props.initialSeries?.title ?? "");
  const [people, setPeople] = createSignal<Person[]>(
    [...(props.initialSeries?.people ?? [])].sort((a, b) => a.order - b.order),
  );
  const [randomizeOnStart, setRandomizeOnStart] = createSignal(
    props.initialSeries?.randomizeOnStart ?? false,
  );
  const isEditing = createMemo(() => props.initialSeries !== undefined);
  const [newPartic, setNewPartic] = createSignal<string>();

  const submitNewParticipant = () => {
    if (!newPartic()) return;
    const newId = `new-${Date.now()}`;
    setPeople((p) => [
      ...p,
      { name: newPartic()!, id: newId, order: p.length },
    ]);
    setNewPartic(undefined);
  };

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    props.onSubmit({
      title: title(),
      people: people().map((p, i) => ({ ...p, order: i })),
      randomizeOnStart: randomizeOnStart(),
    });
  };

  return (
    <form class="flex flex-col gap-2" onSubmit={handleSubmit}>
      <div class="form-control self-start">
        <label for="standup-title-input" class="label">
          Title:
        </label>
        <input
          value={title()}
          placeholder="Name your standup"
          class="input input-bordered"
          id="standup-title-input"
          onInput={(e) => setTitle(e.currentTarget.value)}
          type="text"
        />
      </div>
      <DragDropProvider onDragEnd={(event) => setPeople((p) => move(p, event))}>
        <ul class="participant-list">
          <For each={people()}>
            {(partic, index) => (
              <SortableItem
                id={partic.id}
                index={index()}
                name={partic.name}
                onRemove={() => {
                  setPeople((p) =>
                    p
                      .filter((person) => person.id !== partic.id)
                      .map((person, i) => ({ ...person, order: i })),
                  );
                }}
              />
            )}
          </For>
        </ul>
      </DragDropProvider>
      {newPartic()?.length ? (
        <div class="text-base-content p-1 text-opacity-60">{newPartic()}</div>
      ) : null}
      <span class="align flex gap-2">
        <div class="form-control">
          <label for="new-participant-input" class="label">
            New Participant:
          </label>
          <input
            class="input input-bordered"
            id="new-participant-input"
            type="text"
            value={newPartic() ?? ""}
            onKeyDown={(ev) => {
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
            checked={randomizeOnStart()}
            onChange={(e) => setRandomizeOnStart(e.target.checked)}
          />
          <span class="label-text">Randomize Order On Start</span>
        </label>
      </div>
      <button class="btn self-start" type="submit">
        {isEditing() ? "Update Standup" : "Create Standup"}
      </button>
      {isEditing() && (
        <p class="m-0 font-light">
          Updating a standup meeting will reset the state of the in-progress
          meeting.
        </p>
      )}
    </form>
  );
}
