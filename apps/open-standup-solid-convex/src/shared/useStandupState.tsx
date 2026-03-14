import { createMemo } from "solid-js";
import { createQuery, createMutation } from "./convex";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

// ---------------------------------------------------------------------------
// Types derived from the Convex schema
// ---------------------------------------------------------------------------

type Person = Doc<"people">;
type Update = Doc<"updates"> & { person: Person | null };

export interface SeriesState {
  id: string;
  people: Person[];
  randomizeOnStart: boolean;
  title: string;
}

export interface MeetingState {
  instanceId: Id<"meetingInstances"> | undefined;
  currentlyUpdating: Id<"people"> | undefined;
  allDone: boolean;
  updates: Update[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribe to real-time standup state for a meeting series.
 *
 * Uses Convex reactive subscriptions so the UI updates automatically
 * whenever any participant advances, skips, or resets.
 */
export function useStandupState(meetingId: string) {
  const id = meetingId as Id<"meetings">;

  // Real-time subscriptions — update automatically via WebSocket
  const meeting = createQuery(api.tasks.getMeeting, { meetingId: id });
  const people = createQuery(api.tasks.getPeople, { meetingId: id });
  const instanceWithUpdates = createQuery(
    api.tasks.getLatestInstanceWithUpdates,
    { meetingId: id },
  );

  // Mutations
  const completeUpdate = createMutation(api.tasks.completeUpdate);
  const skipUpdateMut = createMutation(api.tasks.skipUpdate);
  const resetAllMut = createMutation(api.tasks.resetAll);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const isLoading = () => meeting() === undefined || people() === undefined;

  const seriesState = createMemo<SeriesState | undefined>(() => {
    const m = meeting();
    const p = people();
    if (!m || !p) return undefined;

    return {
      id: meetingId,
      people: p,
      randomizeOnStart: m.randomizeOnStart,
      title: m.name,
    };
  });

  const meetingState = createMemo<MeetingState>(() => {
    const data = instanceWithUpdates();
    const allUpdates: Update[] = data?.updates ?? [];

    const active = allUpdates.find(
      (u) => u.startedAt !== undefined && u.endedAt === undefined,
    );

    const allDone =
      allUpdates.length > 0 && allUpdates.every((u) => u.endedAt !== undefined);

    return {
      instanceId: data?._id,
      currentlyUpdating: active?.personId,
      allDone,
      updates: allUpdates,
    };
  });

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const handleNext = async () => {
    const instId = instanceWithUpdates()?._id;
    if (!instId) return;
    await completeUpdate({ meetingInstanceId: instId });
  };

  const handleSkip = async () => {
    const instId = instanceWithUpdates()?._id;
    if (!instId) return;
    await skipUpdateMut({ meetingInstanceId: instId });
  };

  const handleReset = async () => {
    const instId = instanceWithUpdates()?._id;
    if (!instId) return;
    await resetAllMut({ meetingInstanceId: instId });
  };

  return {
    isLoading,
    seriesState,
    meetingState,
    handleNext,
    handleSkip,
    handleReset,
  };
}
