import { SupabaseClient } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/query-core";
import { Database } from "./db-types";
import { StandupUpdate } from "./types";

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
        console.log("change", supaChange);
        const updatedMeeting = supaChange.new.meeting_instance_id;
        const allQueries = queryClient.getQueriesData<SupabaseMeetingState>({
          queryKey: ["standup-series"],
        });
        const foundMeeting = allQueries.find((q) =>
          q[1]?.data?.meeting_instances.find((i) => i.id === updatedMeeting),
        )?.[1];
        if (!foundMeeting?.data?.id) {
          return;
        }
        queryClient.invalidateQueries({
          queryKey: [
            "standup-series",
            String(foundMeeting?.data?.id),
            "updates",
          ],
        });
      },
    )
    .subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      channel.track({});
    });
  return sub;
};
