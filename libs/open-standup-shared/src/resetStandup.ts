import { SupabaseClient } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/query-core";
import { Database } from "./db-types";
import { StandupUpdate } from "./types";

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
