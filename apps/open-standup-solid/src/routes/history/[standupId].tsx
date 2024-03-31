import {
  QueryClient,
  createQuery,
  dehydrate,
  hydrate,
  useQueryClient,
} from "@tanstack/solid-query";
import { For, createResource } from "solid-js";
import { useParams } from "@solidjs/router";
import { supabase } from "~/shared/supabase";

const getStandupUpdates = ({ standupId }: { standupId: string }) =>
  supabase
    .from("meetings")
    .select(
      `*,meeting_instances(id, created_at, updates(*), complete), people(*)`,
    )
    .eq("id", standupId)
    .eq("meeting_instances.complete", true)
    .single();

export default function history() {
  const client = useQueryClient();

  const [dehydratedQueryState] = createResource(async () => {
    const params = useParams();
    const standupId = params["standupId"];
    const queryClient = new QueryClient();
    await queryClient.prefetchQuery({
      queryKey: ["standup-series", standupId, "history"],
      queryFn: () => getStandupUpdates({ standupId }),
    });
    return dehydrate(queryClient);
  });
  const params = useParams();
  const standupId = params["standupId"];

  hydrate(client, dehydratedQueryState());
  const standupHistoryQuery = createQuery(() => ({
    queryKey: ["standup-series", standupId, "history"],
    queryFn: async () => getStandupUpdates({ standupId }),
  }));
  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "4px" }}>
      <For each={standupHistoryQuery.data?.data?.meeting_instances}>
        {(d) => (
          <div class="bg-neutral-100 p-1">
            {d.id}:{" "}
            <For each={d.updates}>
              {(update) => (
                <div style={{ display: "flex", gap: "4px" }}>
                  <span>
                    name:{" "}
                    {
                      standupHistoryQuery.data?.data?.people.find(
                        (p) => p.id === update.person_id,
                      )?.name
                    }
                  </span>
                  <span>duration: {update.duration}, </span>
                </div>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}
