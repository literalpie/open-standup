import type { StandupSeriesNoId } from "~/components/SeriesForm";
import { client } from "./convex";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export async function updateMeeting(
  formData: StandupSeriesNoId & { id?: string },
) {
  if (!formData.id) {
    const result = await client.mutation(api.tasks.createMeeting, {
      name: formData.title,
      people: formData.people.map((p, index) => ({
        name: p.name,
        order: p.order ?? index,
      })),
      randomizeOnStart: formData.randomizeOnStart,
    });
    return result.meetingId;
  } else {
    const meetingId = formData.id as Id<"meetings">;
    await client.mutation(api.tasks.updateMeeting, {
      meetingId,
      name: formData.title,
      people: formData.people.map((p, index) => ({
        id:
          p.id && !p.id.startsWith("new-") ? (p.id as Id<"people">) : undefined,
        name: p.name,
        order: p.order ?? index,
      })),
      randomizeOnStart: formData.randomizeOnStart,
    });
    return meetingId;
  }
}
