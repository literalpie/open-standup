import { createEffect, createSignal, For } from "solid-js";
import "../app.css";

import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import { FunctionReturnType } from "convex/server";
import { Id } from "../../convex/_generated/dataModel";
import PersonStatus from "~/components/PersonStatus";

const client = new ConvexClient(import.meta.env.VITE_CONVEX_URL as string);

export default function App() {
  const instanceId: Id<"meetingInstances"> =
    "jh7as8tx2z0f8mk8vn8e3c27zn7p7hty" as unknown as Id<"meetingInstances">;
  const [meetingUpdates, setMeetingUpdates] =
    createSignal<FunctionReturnType<typeof api.tasks.getUpdates>>();
  createEffect(() => {
    client.onUpdate(
      api.tasks.getUpdates,
      { meetingInstanceId: instanceId },
      setMeetingUpdates,
    );
  });
  return (
    <main>
      <For each={meetingUpdates()}>
        {(update) => {
          console.log("update", update);
          return (
            <PersonStatus
              done={!!update.endedAt}
              updateStartTime={
                update.startedAt !== undefined
                  ? new Date(update.startedAt)
                  : undefined
              }
              updateEndTime={update.endedAt !== undefined ? new Date(update.endedAt) : undefined}
              name={update.person?.name ?? "oops"}
              current={update.startedAt !== undefined && update.endedAt === undefined}
            />
          );
        }}
      </For>
      <button
        onClick={() => {
          client.mutation(api.tasks.completeUpdate, {
            meetingInstanceId: instanceId,
          });
        }}
      >
        next
      </button>
      <button
        onClick={() => {
          client.mutation(api.tasks.skipUpdate, {
            meetingInstanceId: instanceId,
          });
        }}
      >
        skip
      </button>
      <button
        onClick={() => {
          client.mutation(api.tasks.resetAll, {
            meetingInstanceId: instanceId,
          });
        }}
      >
        reset
      </button>
    </main>
  );
}
