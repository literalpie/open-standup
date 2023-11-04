import { StandupMeeting, StandupUpdate } from "./types";

export const getMeetingState = ({
  updates,
  id,
}: {
  updates: StandupUpdate[];
  id: string;
}): StandupMeeting => {
  const updatedAt = updates.reduce((soFar, newOne) => {
    return new Date(newOne.updated_at).getTime() > soFar
      ? new Date(newOne.updated_at).getTime()
      : soFar;
  }, 0);
  const currentUpdate = updates?.find((update) => update.started_at !== null);
  return {
    allDone: updates.every((update) => (update.duration ?? 0) > 0),
    seriesId: String(id),
    updates: updates.map((update: StandupUpdate) => ({
      done: (update.duration ?? 0) > 0,
      personId: String(update.id),
      optimistic: update.optimistic,
      duration: update.duration ?? undefined,
      startTime:
        update.started_at !== undefined && update.started_at !== null
          ? new Date(update.started_at)
          : undefined,
    })),
    updateTime: updatedAt !== undefined ? new Date(updatedAt) : new Date(),
    currentlyUpdating: updates ? String(currentUpdate?.id) : undefined,
    currentOptimistic: currentUpdate?.optimistic ?? false,
  };
};
