import { StandupMeeting, getMeetingState } from "open-standup-shared";
import { createQuery } from "@tanstack/solid-query";
import { createMemo } from "solid-js";
import { supabase } from "./supabase";

// get the instance with the latest created-at, then get all updates of that instance.
export const getStandupUpdates = ({ standupId }: { standupId: string }) =>
  supabase
    .from("meetings")
    .select(
      `*,meeting_instances(id, created_at, updates(*), complete), people(*)`,
    )
    .eq("id", standupId)
    .eq("meeting_instances.complete", false)
    .single();

/** Fetches necessary data for a standup state. */
export function useStandupState(standupId: string) {
  const query = createQuery(() => ({
    queryKey: ["standup-series", standupId, "updates"],
    queryFn: async () => getStandupUpdates({ standupId }),
  }));
  const meeting = () => query.data?.data;
  const seriesState = () => ({
    id: standupId,
    people:
      meeting()?.people?.map((p) => ({
        id: String(p.id),
        name: p.name,
        order:
          meeting()?.meeting_instances[0]?.updates.find(
            (u) => u.person_id === p.id,
          )?.order ?? p.id,
      })) ?? [],
    randomizeOnStart: meeting()?.randomize_order ?? false,
    title: meeting()?.title ?? "Unknown Title",
  });
  const meetingState = createMemo<StandupMeeting>(() =>
    getMeetingState({
      id: standupId,
      updates: meeting()?.meeting_instances[0]?.updates ?? [],
    }),
  );

  return {
    isLoading: () => query.isLoading,
    isError: () => query.isError,
    seriesState,
    meetingState,
  };
}
