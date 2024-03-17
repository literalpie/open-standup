import {
  StandupMeeting,
  defaultMeetingState,
  getMeetingState,
} from "open-standup-shared";
import { createQuery } from "@tanstack/solid-query";
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
  const updateQuery = createQuery(() => ({
    queryKey: ["standup-series", standupId, "updates"],
    queryFn: async () => getStandupUpdates({ standupId }),
  }));
  const seriesQuery = createQuery(() => ({
    queryKey: ["standup-series", standupId, "meeting"],
    queryFn: async () => getStandupMeeting({ standupId }),
  }));
  const isLoading = createMemo(
    () => updateQuery.isLoading || seriesQuery.isLoading,
  );
  const isError = createMemo(() => updateQuery.isError || seriesQuery.isError);
  const updates = () => updateQuery.data?.data;
  const fetchedSeries = () => seriesQuery.data?.data;
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
    return updates()
      ? getMeetingState({ updates: updates()!, id: standupId })
      : defaultMeetingState;
  });

  return { isLoading, isError, seriesState, meetingState };
}
