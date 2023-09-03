import { A, createRouteAction, useParams } from "solid-start";
import { StandupUpdate } from "~/shared/types";
import { QueryClient, useQueryClient } from "@tanstack/solid-query";
import { For, Show, onCleanup, onMount } from "solid-js";
import PersonStatus from "~/components/PersonStatus";
import { supabase } from "~/shared/supabase";
import { useStandupState } from "~/shared/useStandupState";

const advanceCurrentPerson = async function ({
  standupId,
  finishUpdate,
  queryClient,
}: {
  /** If true, mark the current update as complete. If false, move to the next person without marking as complete. */
  finishUpdate: boolean;
  standupId: string;
  queryClient: QueryClient;
}) {
  // hopefully when this function is called, updates are already loaded
  const updates = queryClient.getQueryData<{ data?: StandupUpdate[] }>([
    "standup-series",
    standupId,
    "updates",
  ]);
  if (updates?.data?.every((up) => up.duration !== null)) {
    return;
  }
  const sortedUpdates = [...(updates?.data ?? [])]?.sort((a, b) => a.id - b.id);
  const updatingIndex = sortedUpdates.findIndex(
    (person) => person.started_at !== null && person.duration === null,
  );
  const updatingUpdate =
    updatingIndex >= 0 ? sortedUpdates[updatingIndex] : undefined;
  const nextAfterCurrent = sortedUpdates.find(
    (person, index) => index > updatingIndex && person.duration === null,
  );
  const firstNotDone = sortedUpdates.find((person) => person.duration === null);
  const nextUpdate = nextAfterCurrent ?? firstNotDone;
  const updatedCurrentUpdate = updatingUpdate
    ? [
        {
          started_at: null,
          meeting_id: +standupId,
          person_name: updatingUpdate.person_name,
          id: updatingUpdate.id,
          duration: finishUpdate
            ? Date.now() - new Date(updatingUpdate.started_at!).getTime()
            : null,
          updated_at: new Date().toISOString(),
        },
      ]
    : [];
  const updatedNextUpdate =
    nextUpdate && nextUpdate.id !== updatingUpdate?.id
      ? [
          {
            id: nextUpdate.id,
            meeting_id: +standupId,
            person_name: nextUpdate.person_name,
            started_at: new Date().toISOString(),
            duration: null,
            updated_at: new Date().toISOString(),
          },
        ]
      : [];
  if (updates?.data?.every((update) => !update.optimistic)) {
    queryClient.setQueryData<{
      data: StandupUpdate[];
    }>(["standup-series", standupId, "updates"], (oldData) => {
      return {
        ...oldData,
        data:
          oldData?.data.map((d) => {
            if (d.id === updatedCurrentUpdate[0]?.id) {
              return { ...updatedCurrentUpdate[0], optimistic: true };
            } else if (d.id === updatedNextUpdate[0]?.id) {
              return { ...updatedNextUpdate[0], optimistic: true };
            } else {
              return d;
            }
          }) ?? [],
      };
    });
    const removeOldUpdating = supabase
      .from("updates")
      .upsert([...updatedCurrentUpdate, ...updatedNextUpdate]);

    await removeOldUpdating;
  }
  return true;
};

const resetStandup = async function ({
  queryClient,
  standupId,
}: {
  queryClient: QueryClient;
  standupId: string;
}) {
  // optimisitic update in solid-query
  queryClient.setQueryData<{
    data: StandupUpdate[];
  }>(["standup-series", standupId, "updates"], (oldData) => {
    return {
      ...oldData,
      data:
        oldData?.data.map((d) => {
          return { ...d, duration: null, started_at: null };
        }) ?? [],
    };
  });
  // actual update in supabase
  const result = await supabase
    .from("updates")
    .update({ duration: null, started_at: null })
    .eq("meeting_id", standupId);

  return result;
};

function useReactiveStandupState() {
  const queryClient = useQueryClient();

  // subscribe to supabase changes and update the queryClient
  onMount(() => {
    const sub = supabase
      .channel("updates")
      .on<StandupUpdate>(
        "postgres_changes",
        { schema: "public", event: "UPDATE", table: "updates" },
        (supaChange) => {
          const updatedMeeting = String(supaChange.new.meeting_id);
          queryClient.setQueryData<{
            data: StandupUpdate[];
          }>(["standup-series", updatedMeeting, "updates"], (oldData) => {
            return {
              ...oldData,
              data:
                oldData?.data.map((d) => {
                  if (d.id === supaChange.new.id) {
                    return supaChange.new;
                  } else {
                    return d;
                  }
                }) ?? [],
            };
          });
        },
      )
      .subscribe();
    onCleanup(() => {
      sub.unsubscribe();
    });
  });
}

export default function StandupMeetingComponent() {
  const params = useParams();
  const queryClient = useQueryClient();
  const seriesQuery = useStandupState(params.standupId);
  useReactiveStandupState();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, { Form }] = createRouteAction(async (formData: FormData) => {
    if (formData.get("Next") !== null) {
      const result = await advanceCurrentPerson({
        finishUpdate: true,
        standupId: params.standupId,
        queryClient,
      });
      return result;
    }
    if (formData.get("Skip") !== null) {
      const result = await advanceCurrentPerson({
        finishUpdate: false,
        standupId: params.standupId,
        queryClient,
      });
      return result;
    }
    if (formData.get("Reset") !== null) {
      resetStandup({ queryClient, standupId: params.standupId });
    }
  });

  return (
    <div class="p-3">
      <Show when={params.standupId === "1"}>
        <h2 class="font-bold text-lg p-1">Welcome!</h2>
        <p>
          This is Open Standup. An app to help teams have quick and simple sync
          meetings.
        </p>
        <p>Play with the demo below, or make your own meeting</p>
        <div class="flex justify-center py-1">
          <A href={"/new"} class="btn btn-neutral w-1/2">
            Create new standup
          </A>
        </div>
        <details>
          <summary class="cursor-pointer">How does it work?</summary>
          <p>
            The name of the currently updating person is highlighted in blue.
            The name of anyone who has already done their update is highlighted
            in green.
          </p>

          <p>
            Anyone in the world who is viewing the demo at the same time will
            see the same state that you see. Try using the buttons to change
            which participant is currently updating.
          </p>
        </details>
      </Show>
      <div class="flex justify-center items-center gap-2 pb-1">
        <Show
          when={!seriesQuery?.isLoading()}
          fallback={
            <div class="animate-pulse flex w-1/5 h-4 bg-slate-200 rounded" />
          }
        >
          <h2 class="font-semibold text-lg">
            {seriesQuery?.seriesState()?.title}
          </h2>
        </Show>
        <A
          class="edit-button btn btn-sm btn-outline"
          href={`/${params.standupId}/edit`}
        >
          Edit
        </A>
      </div>
      <Show
        when={!seriesQuery?.isLoading()}
        fallback={
          <div>
            <div class="animate-pulse h-5 bg-slate-200 rounded m-1" />
            <div class="animate-pulse h-5 bg-slate-200 rounded m-1" />
            <div class="animate-pulse h-5 bg-slate-200 rounded m-1" />
            <div class="animate-pulse h-5 bg-slate-200 rounded m-1" />
            <div class="animate-pulse h-5 bg-slate-200 rounded m-1" />
            <div class="flex">
              <span class="inline animate-pulse w-1/2 h-10 bg-slate-200 rounded m-1" />
              <span class="inline animate-pulse w-1/2 h-10 bg-slate-200 rounded m-1" />
            </div>
          </div>
        }
      >
        <Form>
          <For each={seriesQuery.seriesState()?.people}>
            {(person) => {
              const thisPersonUpdate = () =>
                seriesQuery
                  ?.meetingState()
                  ?.updates?.find(
                    (update) => update.personId === person.id && update.done,
                  );
              const current = () =>
                person.id === seriesQuery?.meetingState().currentlyUpdating;
              const optimistic = () =>
                thisPersonUpdate()?.optimistic ||
                (current() && seriesQuery.meetingState().currentOptimistic);
              const isDone = () => thisPersonUpdate() !== undefined;
              return (
                <PersonStatus
                  name={person.name}
                  done={isDone()}
                  current={current()}
                  optimistic={optimistic()}
                />
              );
            }}
          </For>
          <div class="pt-3 flex gap-1">
            {seriesQuery?.meetingState().allDone ? (
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
                <button class="btn flex-grow btn-outline" name="Skip">
                  Skip
                </button>
              </>
            )}
          </div>
        </Form>
      </Show>
    </div>
  );
}
