import {
  QueryClient,
  createQuery,
  dehydrate,
  hydrate,
  useQueryClient,
} from "@tanstack/solid-query";
import { For } from "solid-js";
import { createRouteData, useParams, useRouteData } from "solid-start";
import { supabase } from "~/shared/supabase";

export const getStandupUpdates = ({ standupId }: { standupId: string }) =>
  supabase
    .from("meetings")
    .select(
      `*,meeting_instances(id, created_at, updates(*), complete), people(*)`,
    )
    .eq("id", standupId)
    .eq("meeting_instances.complete", true)
    .single();

export function routeData() {
  console.log("getting route data");
  const params = useParams();
  const standupId = params["standupId"];
  const queryClient = new QueryClient();

  return createRouteData(async () => {
    await queryClient.prefetchQuery({
      queryKey: ["standup-series", standupId, "history"],
      queryFn: () => getStandupUpdates({ standupId }),
    });
    return dehydrate(queryClient);
  });
}

export default function history() {
  const dehydratedQueryState = useRouteData<typeof routeData>();
  const queryClient: any = useQueryClient();
  const params = useParams();
  const standupId = params["standupId"];

  hydrate(queryClient, dehydratedQueryState());
  const standupHistoryQuery = createQuery(() => ({
    queryKey: ["standup-series", standupId, "history"],
    queryFn: async () => getStandupUpdates({ standupId }),
  }));
  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "4px" }}>
      {standupHistoryQuery.data?.data?.meeting_instances.map((d) => (
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
      ))}
    </div>
  );
}
