import { SupabaseClient } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/query-core";
import { Database } from "./db-types";

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
  await supabase
    .from("meeting_instances")
    .update({ complete: true })
    .eq("meeting_id", +standupId)
    .eq("complete", false);

  const newInstanceResult = await supabase
    .from("meeting_instances")
    .insert({ meeting_id: +standupId })
    .select()
    .single();
  const meetingPeople = await supabase
    .from("people")
    .select("id, order")
    .eq("meeting_id", standupId);
  meetingPeople.data &&
    (await supabase.from("updates").insert(
      meetingPeople.data.map((p) => ({
        order: randomizeOrder ? getRandomOrderValue() : p.order,
        meeting_instance_id: newInstanceResult.data!.id,
        person_id: p.id,
      })),
    ));
  queryClient.invalidateQueries({
    queryKey: ["standup-series", standupId, "updates"],
  });
};
