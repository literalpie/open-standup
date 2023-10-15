import { SupabaseClient } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/query-core";
import { Database } from "./db-types";
import { StandupUpdate } from "./types";
export * from "./types";

const getRandomOrderValue = () => Math.round(Math.random() * 10000);
export const resetStandup = async function ({
  queryClient,
  standupId,
  randomizeOrder,
  supabase,
}: {
  queryClient: QueryClient;
  standupId: string;
  randomizeOrder: boolean;
  supabase: SupabaseClient<Database>;
}) {
  const existingUpdates = queryClient.getQueryData<{
    data: StandupUpdate[];
  }>(["standup-series", standupId, "updates"]);
  const updatedUpdates =
    existingUpdates?.data
      .filter((d) => d.meeting_id === +standupId)
      .map((update) => {
        return {
          ...update,
          order: randomizeOrder ? getRandomOrderValue() : update.id,
          duration: null,
          started_at: null,
        };
      }) ?? [];
  // optimisitic update in tanstack-query
  queryClient.setQueryData<{
    data: StandupUpdate[];
  }>(["standup-series", standupId, "updates"], (oldData) => {
    return {
      ...oldData,
      data:
        oldData?.data.map((d) => {
          const matchingUpdate = updatedUpdates.find((u) => u.id === d.id);
          return matchingUpdate ?? d;
        }) ?? [],
    };
  });
  // actual update in supabase
  const result = await supabase
    .from("updates")
    .upsert(updatedUpdates)
    .eq("meeting_id", standupId);

  return result;
};

export const advanceCurrentPerson = async function ({
  standupId,
  finishUpdate,
  queryClient,
  supabase,
}: {
  /** If true, mark the current update as complete. If false, move to the next person without marking as complete. */
  finishUpdate: boolean;
  standupId: string;
  queryClient: QueryClient;
  supabase: SupabaseClient<Database>;
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
  const sortedUpdates = [...(updates?.data ?? [])]?.sort(
    (a, b) => (a.order ?? a.id) - (b.order ?? b.id),
  );
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
              return {
                ...updatedCurrentUpdate[0],
                optimistic: true,
                order: d.order,
              };
            } else if (d.id === updatedNextUpdate[0]?.id) {
              return {
                ...updatedNextUpdate[0],
                optimistic: true,
                order: d.order,
              };
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

export const subscribeToStandupChange = ({
  supabase,
  queryClient,
  onParticipantCountChange,
}: {
  supabase: SupabaseClient<Database>;
  queryClient: QueryClient;
  onParticipantCountChange: (count: number) => void;
}) => {
  const channel = supabase.channel("updates");

  const sub = channel
    .on("presence", { event: "sync" }, () => {
      const newState = channel.presenceState();
      onParticipantCountChange(Object.keys(newState).length);
    })
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
    .subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      channel.track({});
    });
  return sub;
};
