import {
  QueryClient,
  createQuery,
  dehydrate,
  hydrate,
  useQueryClient,
} from "@tanstack/solid-query";
import { createEffect, createMemo, createResource, onMount } from "solid-js";
import { useParams } from "@solidjs/router";
import { supabase } from "~/shared/supabase";
import { Line } from "solid-chartjs";
import {
  Chart,
  Title,
  Tooltip,
  Legend,
  Colors,
  ChartOptions,
  ChartDataset,
} from "chart.js";

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

  onMount(() => {
    Chart.register(Title, Tooltip, Legend, Colors);
  });
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

  const chartData = createMemo(
    () => {
      const standupHistoryData = standupHistoryQuery.data?.data;
      const formatter = new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      const labels = standupHistoryData?.meeting_instances.map((i) =>
        formatter.format(new Date(i.created_at ?? "")),
      );
      const datasets: ChartDataset[] =
        standupHistoryData?.people.map((person) => {
          return {
            label: person.name,

            data: standupHistoryData?.meeting_instances.map((instance) =>
              Math.min(
                instance.updates.find((u) => u.person_id === person.id)
                  ?.duration ?? 0,
                60 * 1000 * 30,
              ),
            ),
          };
        }) ?? [];
      return { labels, datasets };
    },
    {},
    {
      equals: (a, b) =>
        // assume the data hasn't changed unless there's a change in the number of meeting instances
        a.datasets[0]?.data.length === b.datasets[0]?.data.length,
    },
  );
  const chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (value) => {
            const totalSeconds = value.parsed.y / 1000;
            const minutes = Math.round(totalSeconds / 60);
            const seconds = Math.round(totalSeconds % 60);
            if (minutes === 0) {
              return `${seconds}s`;
            }
            return `${minutes}m ${seconds}s`;
          },
        },
      },
    },
    scales: {
      y: {
        max: 60 * 1000 * 5,
        ticks: {
          count: 6,
          callback: (value) => `${+value / 1000 / 60} minutes`,
        },
      },
    },
  };
  createEffect(() => {
    console.log("chart data", chartData());
  });
  return (
    <div class="absolute max-w-4xl" style={{ width: "98%" }}>
      <Line data={chartData()} options={chartOptions} />
      {/* <For each={standupHistoryQuery.data?.data?.meeting_instances}>
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
      </For> */}
    </div>
  );
}
