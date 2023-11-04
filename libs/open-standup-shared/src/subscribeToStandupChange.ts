import { SupabaseClient } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/query-core";
import { Database } from "./db-types";
import { StandupUpdate } from "./types";

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
