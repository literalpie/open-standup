import { StandupMeeting, StandupUpdate } from "~/shared/types";
import { createQueries } from "@tanstack/solid-query";
import { createMemo } from "solid-js";
import { supabase } from "./supabase";

export const getStandupMeeting = ({ standupId }: { standupId: string }) =>
  supabase.from("meetings").select("*").eq("id", standupId).single();

export const getStandupUpdates = ({ standupId }: { standupId: string }) =>
  supabase
    .from("updates")
    .select("*")
    .eq("meeting_id", standupId)
    .order("id", { ascending: true });

/** Fetches necessary data for a standup state. */
export function useStandupState(standupId: string) {
  const queries = createQueries(() => ({
    queries: [
      {
        queryKey: ["standup-series", standupId, "updates"],
        queryFn: async () => getStandupUpdates({ standupId }),
      },
      {
        queryKey: ["standup-series", standupId, "meeting"],
        queryFn: async () => getStandupMeeting({ standupId }),
      },
    ],
  }));

  const isLoading = createMemo(() => queries.some((q) => q.isLoading));
  const isError = createMemo(() => queries.some((q) => q.isError));
  const updates = () => queries[0].data?.data;
  const fetchedSeries = () => queries[1].data?.data;
  const seriesState = createMemo(
    () => {
      return isLoading()
        ? undefined
        : {
            id: standupId,
            people:
              updates()?.map((p) => ({
                id: String(p.id),
                name: p.person_name,
                order: p.order ?? p.id,
              })) ?? [],
            randomizeOnStart: fetchedSeries()?.randomize_order ?? false,
            title: fetchedSeries()?.title ?? "Unknown Title",
          };
    },
    undefined,
    {
      // seriesState should only be updated when the data changes
      equals: (a, b) => {
        return (
          a !== undefined &&
          b !== undefined &&
          a.id === b?.id &&
          a.randomizeOnStart === b?.randomizeOnStart &&
          a.title === b?.title &&
          a.people.length === b?.people.length &&
          a.people.every((p, i) => {
            return (
              p.id === b.people[i].id &&
              p.name === b.people[i].name &&
              p.order === b.people[i].order
            );
          })
        );
      },
    },
  );

  const meetingState = createMemo<StandupMeeting>(() => {
    const updatedAt = updates()?.reduce((soFar, newOne) => {
      return new Date(newOne.updated_at).getTime() > soFar
        ? new Date(newOne.updated_at).getTime()
        : soFar;
    }, 0);
    const currentUpdate: () => StandupUpdate | undefined = () =>
      updates()?.find((update) => update.started_at !== null);
    return {
      allDone: updates()?.every((update) => (update.duration ?? 0) > 0),
      seriesId: standupId,
      updates: updates()?.map((update: StandupUpdate) => ({
        done: (update.duration ?? 0) > 0,
        personId: String(update.id),
        optimistic: update.optimistic,
        duration: update.duration,
        startTime:
          update.started_at !== undefined && update.started_at !== null
            ? new Date(update.started_at)
            : undefined,
      })),
      updateTime: updatedAt !== undefined ? new Date(updatedAt) : new Date(),
      currentlyUpdating: updates() ? String(currentUpdate()?.id) : undefined,
      currentOptimistic: currentUpdate()?.optimistic,
    } as StandupMeeting;
  });

  return { isLoading, isError, seriesState, meetingState };
}
