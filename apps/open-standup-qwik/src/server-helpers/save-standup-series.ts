import { globalAction$, z, zod$ } from "@builder.io/qwik-city";
import { getSbClient } from "./get-sb-client";

export const useSaveStandupSeries = globalAction$(
  async (formData, requestEventAction) => {
    const sbClient = await getSbClient(requestEventAction);

    const meetings = await sbClient
      .from("meetings")
      .upsert({
        id: formData.id !== undefined ? +formData.id : undefined,
        title: formData.title,
        randomize_order: formData.randomizeOnStart,
      })
      .select("id")
      .single();
    console.log("meetings res", meetings);
    if (formData.id !== undefined) {
      const del = await sbClient
        .from("updates")
        .delete()
        .eq("meeting_id", formData.id);
      console.log("del", del);
    }
    if (meetings.data) {
      const updates = formData.people.map((p) => ({
        meeting_id: meetings.data.id,
        person_name: p.name,
      }));
      await sbClient.from("updates").insert(updates);
      return meetings.data.id;
    }
    return undefined;
  },
  zod$({
    id: z.string().optional(),
    title: z.string(),
    randomizeOnStart: z.boolean(),
    people: z.array(
      z.object({ name: z.string(), id: z.string(), order: z.number() }),
    ),
  }),
);
