import { For, Show, createMemo } from "solid-js";
import PersonStatus from "~/components/PersonStatus";
import { useStandupState } from "~/shared/useStandupState";
import { A, useParams } from "@solidjs/router";

export default function StandupMeetingComponent() {
  const params = useParams();
  const meetingId = params["standupId"];
  const standup = useStandupState(meetingId!);

  const sortedPeople = createMemo(() => {
    const series = standup.seriesState();
    if (!series) return [];
    return [...series.people].sort((a, b) => a.order - b.order);
  });

  return (
    <div class="p-3">
      <div class="flex items-center gap-2 pb-1">
        <div class="flex-grow basis-12" />
        <Show
          when={!standup.isLoading()}
          fallback={
            <div class="flex h-4 w-1/5 animate-pulse rounded bg-slate-200" />
          }
        >
          <h2 class="text-lg font-semibold">{standup.seriesState()?.title}</h2>
        </Show>
        <A
          class="edit-button btn btn-sm btn-outline"
          href={`/${meetingId}/edit`}
        >
          Edit
        </A>
        <div class="flex-grow basis-12" />
      </div>

      <Show
        when={!standup.isLoading()}
        fallback={
          <div>
            <div class="m-1 h-5 animate-pulse rounded bg-slate-200" />
            <div class="m-1 h-5 animate-pulse rounded bg-slate-200" />
            <div class="m-1 h-5 animate-pulse rounded bg-slate-200" />
            <div class="m-1 h-5 animate-pulse rounded bg-slate-200" />
            <div class="m-1 h-5 animate-pulse rounded bg-slate-200" />
            <div class="flex">
              <span class="m-1 inline h-10 w-1/2 animate-pulse rounded bg-slate-200" />
              <span class="m-1 inline h-10 w-1/2 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        }
      >
        <div>
          <For each={sortedPeople()}>
            {(person) => {
              const update = () =>
                standup
                  .meetingState()
                  .updates.find((u) => u.personId === person._id);
              const isCurrent = () =>
                person._id === standup.meetingState().currentlyUpdating;
              const isDone = () => update()?.endedAt !== undefined;
              const startTime = () => update()?.startedAt;
              const endTime = () => update()?.endedAt;

              return (
                <PersonStatus
                  name={person.name}
                  done={isDone()}
                  current={isCurrent()}
                  updateStartTime={startTime()}
                  updateEndTime={endTime()}
                />
              );
            }}
          </For>

          <div class="flex gap-1 pt-3">
            {standup.meetingState().allDone ? (
              <>
                <div class="flex-grow">All Done!</div>
                <button
                  class="btn btn-neutral flex-grow"
                  onClick={standup.handleReset}
                >
                  Reset
                </button>
              </>
            ) : (
              <>
                <button
                  class="btn btn-neutral flex-grow"
                  onClick={standup.handleNext}
                >
                  Next
                </button>
                <button
                  class="btn btn-outline flex-grow"
                  onClick={standup.handleSkip}
                >
                  Skip
                </button>
              </>
            )}
          </div>
        </div>
      </Show>
    </div>
  );
}
