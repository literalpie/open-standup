import { createRouteAction, useParams } from "solid-start";
import { createClient } from "@supabase/supabase-js";
import { Database } from "~/shared/db-types";
import { Person, StandupMeeting } from "~/shared/types";
import {
  QueryClient,
  createQueries,
  useQueryClient,
} from "@tanstack/solid-query";
import { For, Show, createMemo, onCleanup, onMount } from "solid-js";
import PersonStatus from "~/components/PersonStatus";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

type StandupUpdate = Database["public"]["Tables"]["updates"]["Row"] & {
  optimistic?: boolean;
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

const advanceCurrentPerson = async function ({
  standupId,
  finishUpdate,
  queryClient,
}: {
  finishUpdate: boolean;
  standupId: string;
  queryClient: QueryClient;
}) {
  const sbClient = supabase;
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
    const removeOldUpdating = sbClient
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

export const hasPersonUpdated = (
  person: Person,
  updates: StandupMeeting["updates"],
) => {
  return updates.some((update) => update.personId === person.id && update.done);
};

/** fetches necessary data for a standup state and subscribes to updates */
function useStandupState(standupId: string) {
  const queryClient = useQueryClient();
  const queries = createQueries(() => ({
    queries: [
      {
        queryKey: ["standup-series", standupId, "updates"],
        queryFn: async () => {
          return await supabase
            .from("updates")
            .select("*")
            .eq("meeting_id", standupId)
            .order("id", { ascending: true });
        },
      },
      {
        queryKey: ["standup-series", standupId, "meeting"],
        queryFn: async () => {
          return await supabase
            .from("meetings")
            .select("*")
            .eq("id", standupId)
            .single();
        },
      },
    ],
  }));
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
  const isLoading = createMemo(() =>
    queries.some((q) => q.isLoading || q.isFetching),
  );
  const isError = createMemo(() => queries.some((q) => q.isError));
  const updates = () => queries[0].data?.data;
  const fetchedSeries = () => queries[1].data?.data;
  const seriesState = createMemo(() => {
    return {
      id: standupId,
      people:
        updates()?.map((p) => ({
          id: String(p.id),
          name: p.person_name,
          order: p.id,
        })) ?? [],
      randomizeOnStart: fetchedSeries()?.randomize_order ?? false,
      title: fetchedSeries()?.title ?? "Unknown Title",
    };
  });
  const meetingState = createMemo(() => {
    const updatedAt = updates()?.reduce((soFar, newOne) => {
      return new Date(newOne.updated_at).getTime() > soFar
        ? new Date(newOne.updated_at).getTime()
        : soFar;
    }, 0);
    const currentUpdate: () => StandupUpdate | undefined = () =>
      updates()?.find((update) => update.started_at !== null);
    return {
      allDone: updates()?.every((update) => (update.duration ?? 0) > 0),
      seriesId: standupId,
      updates: updates()?.map((update: StandupUpdate) => ({
        done: (update.duration ?? 0) > 0,
        personId: String(update.id),
        optimistic: update.optimistic,
      })),
      updateTime: updatedAt !== undefined ? new Date(updatedAt) : new Date(),
      currentlyUpdating: updates() ? String(currentUpdate()?.id) : undefined,
      currentOptimistic: currentUpdate()?.optimistic,
    } as StandupMeeting;
  });
  return { isLoading, isError, seriesState, meetingState };
}
export default function StandupMeetingComponent() {
  const params = useParams();
  const queryClient = useQueryClient();
  const seriesQuery = useStandupState(params.standupId);
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
  const people = createMemo(() => {
    return seriesQuery?.seriesState().people.map((p) => {
      const thisPersonUpdate = seriesQuery
        ?.meetingState()
        ?.updates?.find((update) => update.personId === p.id && update.done);
      const current = p.id === seriesQuery?.meetingState().currentlyUpdating;
      return {
        updated: thisPersonUpdate !== undefined,
        current,
        optimistic:
          thisPersonUpdate?.optimistic ||
          (current && seriesQuery.meetingState().currentOptimistic),
        ...p,
      };
    });
  });

  return (
    <div class="p-3">
      <Show when={seriesQuery?.isLoading()}>
        <div>Loading...</div>
      </Show>
      <h2 class="text-lg">{seriesQuery?.seriesState().title}</h2>
      ID: {params.standupId}
      <Form>
        <For each={people()}>
          {(person) => {
            return (
              <PersonStatus
                name={person.name}
                done={person.updated}
                current={person.current}
                optimistic={person.optimistic}
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
    </div>
  );
}
