import type { StandupSeriesNoId } from "~/components/SeriesForm";
import { action, redirect } from "@solidjs/router";
import { client } from "./convex";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const updateMeeting = action(
  async (formData: StandupSeriesNoId & { id?: string }) => {
    if (!formData.id) {
      // Create new meeting
      const result = await client.mutation(api.tasks.createMeeting, {
        name: formData.title,
        people: formData.people.map((p, index) => ({
          name: p.name,
          order: p.order ?? index,
        })),
        randomizeOnStart: formData.randomizeOnStart,
      });

      return redirect(`/${result.meetingId}`);
    } else {
      // Update existing meeting
      const meetingId = formData.id as Id<"meetings">;

      await client.mutation(api.tasks.updateMeeting, {
        meetingId,
        name: formData.title,
        people: formData.people.map((p, index) => ({
          id: p.id ? (p.id as Id<"people">) : undefined,
          name: p.name,
          order: p.order ?? index,
        })),
        randomizeOnStart: formData.randomizeOnStart,
      });

      return redirect(`/${meetingId}`);
    }
  },
);
