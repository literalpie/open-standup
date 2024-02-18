import { SupabaseClient } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/query-core";
import { Database } from "./db-types";
// import { StandupUpdate } from "./types";

export type SupabaseMeetingState = {
  data?:
    | {
        created_at: string | null;
        id: number;
        randomize_order: boolean;
        title: string;
        meeting_instances: {
          id: number;
          created_at: string | null;
          updates: {
            duration: number | null;
            meeting_instance_id: number;
            order: number | null;
            person_id: number;
            started_at: string | null;
            updated_at: string;
          }[];
          complete: boolean;
        }[];
        people: {
          id: number;
          meeting_id: number;
          name: string;
          order: number | null;
        }[];
      }
    | null
    | undefined;
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
  console.log("advance!!");

  // hopefully when this function is called, updates are already loaded
  const standup = queryClient.getQueryData<SupabaseMeetingState>([
    "standup-series",
    standupId,
    "updates",
  ]);
  const updates = standup?.data?.meeting_instances[0].updates;
  // const people = standup?.data?.people;
  if (updates?.every((up) => up.duration !== null)) {
    return;
  }
  const sortedUpdates = [...(updates ?? [])]?.sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const updatingIndex = sortedUpdates.findIndex(
    (update) => update.started_at !== null && update.duration === null,
  );
  const updatingUpdate =
    updatingIndex >= 0 ? sortedUpdates[updatingIndex] : undefined;
  const nextAfterCurrent = sortedUpdates.find(
    (update, index) => index > updatingIndex && update.duration === null,
  );
  const firstNotDone = sortedUpdates.find((update) => update.duration === null);
  const nextUpdate = nextAfterCurrent ?? firstNotDone;
  console.log("nextUpdate", sortedUpdates, nextUpdate);
  const updatedCurrentUpdate = updatingUpdate
    ? [
        {
          started_at: null,
          person_id: updatingUpdate.person_id,
          meeting_instance_id: updatingUpdate.meeting_instance_id,
          duration: finishUpdate
            ? Date.now() - new Date(updatingUpdate.started_at!).getTime()
            : null,
          updated_at: new Date().toISOString(),
        },
      ]
    : [];
  const updatedNextUpdate =
    nextUpdate &&
    (nextUpdate.meeting_instance_id !== updatingUpdate?.meeting_instance_id ||
      nextUpdate.person_id !== updatingUpdate?.person_id)
      ? [
          {
            meeting_instance_id: nextUpdate.meeting_instance_id,
            person_id: nextUpdate.person_id,
            started_at: new Date().toISOString(),
            duration: null,
            updated_at: new Date().toISOString(),
          },
        ]
      : [];
  // if (updates?.data?.every((update) => !update.optimistic)) {
  //   queryClient.setQueryData<{
  //     data: StandupUpdate[];
  //   }>(["standup-series", standupId, "updates"], (oldData) => {
  //     return {
  //       ...oldData,
  //       data:
  //         oldData?.data.map((d) => {
  //           if (d.id === updatedCurrentUpdate[0]?.id) {
  //             return {
  //               ...updatedCurrentUpdate[0],
  //               optimistic: true,
  //               order: d.order,
  //             };
  //           } else if (d.id === updatedNextUpdate[0]?.id) {
  //             return {
  //               ...updatedNextUpdate[0],
  //               optimistic: true,
  //               order: d.order,
  //             };
  //           } else {
  //             return d;
  //           }
  //         }) ?? [],
  //     };
  //   });
  const removeOldUpdating = supabase
    .from("updates")
    .upsert([...updatedCurrentUpdate, ...updatedNextUpdate]);

  await removeOldUpdating;
  // queryClient.invalidateQueries({
  //   queryKey: ["standup-series", standupId, "updates"],
  // });
};
