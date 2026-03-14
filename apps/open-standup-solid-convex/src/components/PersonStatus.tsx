import {
  createTimeDifferenceFromNow,
  getCountdown,
} from "@solid-primitives/date";
import { createEffect, createMemo, createSignal } from "solid-js";

const formatAsSeconds = (number: number) => {
  const countdown = getCountdown(number);
  if ((countdown.hours ?? 0) > 0) {
    return `${countdown.hours}h ${countdown.minutes}m`;
  }
  if (countdown.minutes) {
    return `${countdown.minutes}m ${countdown.seconds}s`;
  }
  return `${countdown.seconds ?? 0}s`;
};

export default function PersonStatus(props: {
  name: string;
  done: boolean;
  current: boolean;
  optimistic?: boolean;
  duration?: number;
  updateEndTime?: Date | number;
  updateStartTime?: Date | number;
}) {
  const getTime = (d: Date | number) =>
    typeof d === "number" ? d : d.getTime();

  const [diff] = createTimeDifferenceFromNow(
    () => (props.updateStartTime ? getTime(props.updateStartTime) : 0),
    200,
  );
  const durationLabel = createMemo(() => {
    if (props.updateStartTime && props.updateEndTime === undefined) {
      return formatAsSeconds(Math.max(-1 * diff(), 0));
    }
    if (props.updateStartTime && props.updateEndTime) {
      return formatAsSeconds(
        getTime(props.updateEndTime) - getTime(props.updateStartTime),
      );
    }
    return undefined;
  });
  // Keep track of the previous duration label so it can be shown while animating out
  const [prevDuration, setPrevDuration] = createSignal<string | undefined>();
  createEffect<string | undefined>((previous) => {
    setPrevDuration(previous);
    return durationLabel();
  });
  return (
    <div
      class="flex justify-between px-2 transition duration-500"
      classList={{
        "bg-su-complete dark:bg-su-complete-dark ": props.done,
        "bg-su-in-progress dark:bg-su-in-progress-dark ": props.current,
        "opacity-75": props.optimistic,
      }}
    >
      <div class="px-1">{props.name}</div>
      <div
        class="px-1 transition-opacity duration-500"
        classList={{
          "opacity-0": durationLabel() === undefined,
        }}
      >
        {durationLabel() || prevDuration()}
      </div>
    </div>
  );
}
