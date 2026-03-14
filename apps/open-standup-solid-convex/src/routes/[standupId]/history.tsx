import { useParams } from "@solidjs/router";
import { Show, createMemo } from "solid-js";
import { createQuery } from "~/shared/convex";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Chart, Title, Tooltip, Legend, Colors } from "chart.js";
import { Bar } from "solid-chartjs";
import {
  createSolidTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/solid-table";

Chart.register(Title, Tooltip, Legend, Colors);

interface PersonDuration {
  personId: any;
  personName: string;
  duration: number;
}

interface HistoryInstance {
  instanceId: any;
  createdAt: number;
  duration: number;
  participantCount: number;
  longestUpdate: string;
  shortestUpdate: string;
  perPersonDurations: PersonDuration[];
}

function formatDurationMs(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes === 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

function formatMinutes(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  return minutes.toString();
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export default function HistoryPage() {
  const params = useParams();
  const meetingId = params["standupId"] as Id<"meetings">;

  const history = createQuery(api.tasks.getMeetingHistory, { meetingId });

  const chartData = createMemo(() => {
    const rawData = history();
    if (!rawData) return null;

    const data = rawData.filter(
      (d): d is HistoryInstance => d !== null && d !== undefined,
    );

    if (data.length === 0) return null;

    const labels: string[] = [];
    const allPersonIds = new Set<string>();

    for (const d of data) {
      labels.push(formatDate(d.createdAt));
      if (d.perPersonDurations) {
        for (const p of d.perPersonDurations) {
          allPersonIds.add(p.personId);
        }
      }
    }
    labels.reverse();

    const personIds = Array.from(allPersonIds);
    const reversedData = [...data].reverse();

    const datasets = personIds.map((personId, idx) => {
      let personName = "Unknown";
      for (const d of data) {
        if (d.perPersonDurations) {
          for (const p of d.perPersonDurations) {
            if (p.personId === personId) {
              personName = p.personName;
              break;
            }
          }
        }
      }

      const values: number[] = [];
      for (const d of reversedData) {
        let found = false;
        if (d.perPersonDurations) {
          for (const p of d.perPersonDurations) {
            if (p.personId === personId) {
              values.push(p.duration / 60000);
              found = true;
              break;
            }
          }
        }
        if (!found) values.push(0);
      }

      return {
        label: personName,
        data: values,
        backgroundColor: `hsl(${(idx * 360) / personIds.length}, 70%, 50%)`,
      };
    });

    return { labels, datasets };
  });

  const columnHelper = createColumnHelper<HistoryInstance>();

  const columns = [
    columnHelper.accessor("createdAt", {
      header: "Date",
      cell: (info) => formatDateTime(info.getValue()),
    }),
    columnHelper.accessor("duration", {
      header: "Duration",
      cell: (info) => formatDurationMs(info.getValue()),
    }),
    columnHelper.accessor("participantCount", {
      header: "Participants",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("longestUpdate", {
      header: "Longest",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("shortestUpdate", {
      header: "Shortest",
      cell: (info) => info.getValue(),
    }),
  ];

  const table = createSolidTable({
    get data() {
      return (history() ?? []).filter((d): d is HistoryInstance => d !== null);
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div class="p-4">
      <h1 class="mb-4 text-2xl font-bold">Meeting History</h1>
      <Show when={history()} fallback={<p>Loading...</p>}>
        {(instances) => {
          const filtered = instances().filter(
            (d): d is HistoryInstance => d !== null,
          );
          return (
            <Show
              when={filtered.length > 0}
              fallback={<p>No completed meetings yet</p>}
            >
              <div
                class="mb-8"
                style={{ width: "100%", "max-width": "800px", height: "300px" }}
              >
                <Bar
                  data={chartData()!}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { stacked: true },
                      y: {
                        stacked: true,
                        title: {
                          display: true,
                          text: "Minutes",
                        },
                        ticks: {
                          callback: (value: any) => Math.round(Number(value)),
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                      tooltip: {
                        callbacks: {
                          label: (context: any) => {
                            const value = context.raw as number;
                            return `${context.dataset.label}: ${Math.round(value)}m`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
              <table class="table w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr>
                      {headerGroup.headers.map((header) => (
                        <th>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr>
                      {row.getVisibleCells().map((cell) => (
                        <td>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Show>
          );
        }}
      </Show>
    </div>
  );
}
