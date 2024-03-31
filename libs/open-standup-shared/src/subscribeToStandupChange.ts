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
  // const channelInstances = supabase.channel("meeting_instances");

  // const subInstances = channelInstances
  //   .on(
  //     "postgres_changes",
  //     { schema: "public", event: "INSERT", table: "meeting_instances" },
  //     async (supaChange) => {
  //       console.log("instance change", supaChange, [
  //         "standup-series",
  //         String(supaChange.new.meeting_id),
  //         "updates",
  //       ]);
  //       await queryClient.resetQueries({
  //         queryKey: [
  //           "standup-series",
  //           String(supaChange.new.meeting_id),
  //           "updates",
  //         ],
  //       });
  //       console.log(
  //         "client new value",
  //         queryClient.getQueryData([
  //           "standup-series",
  //           String(supaChange.new.meeting_id),
  //           "updates",
  //         ]),
  //       );
  //     },
  //   )
  // .subscribe();
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
        // queryClient.getQueryData<>
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
        // queryClient.setQueryData<SupabaseMeetingState>(
        //   ["standup-series", String(foundMeeting?.data?.id), "updates"],
        //   (oldData) => {
        //     console.log("old data", oldData);
        //     if (!oldData?.data) {
        //       return oldData;
        //     }
        //     const newInstances = oldData.data.meeting_instances.map(
        //       (instance) => {
        // /* Something is wrong with how this is filtering. Things are staying in the array even though the IDs are equal. */
        //         const filteredUpdates = instance.updates.filter((u) => {
        //           console.log(
        //             "equal",
        //             u.person_id,
        //             supaChange.new.person_id,
        //             u.person_id != supaChange.new.person_id,
        //           );
        //           return u.person_id != supaChange.new.person_id;
        //         });
        //         console.log("filteredUpdates", filteredUpdates);
        //         const updatedUpdates = [...filteredUpdates, supaChange.new];
        //         return instance.id === +updatedMeeting
        //           ? {
        //               ...instance,
        //               updates: updatedUpdates,
        //             }
        //           : instance;
        //       },
        //     );
        //     console.log("newInstances", newInstances);
        //     return {
        //       ...oldData,
        //       data: {
        //         ...oldData?.data,
        //         meeting_instances: newInstances,
        //       },
        //       // oldData?.data..map((d) => {
        //       //   if (d.id === supaChange.new.id) {
        //       //     return supaChange.new;
        //       //   } else {
        //       //     return d;
        //       //   }
        //       // }) ?? [],
        //     } as SupabaseMeetingState;
        //   },
        // );
      },
    )
    .subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      channel.track({});
    });
  return sub;
};
