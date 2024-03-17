import { StandupSeriesNoId } from "~/components/SeriesForm";
import { supabase } from "./supabase";
import { getRandomOrderValue } from "./getRandomOrderValue";
import { action, redirect } from "@solidjs/router";

export const updateMeeting = action(
  async (formData: StandupSeriesNoId & { id?: string }) => {
    const meetings = await supabase
      .from("meetings")
      .upsert({
        id: formData.id !== undefined ? +formData.id : undefined,
        title: formData.title,
        randomize_order: formData.randomizeOnStart,
      })
      .select("id")
      .single();
    if (formData.id !== undefined) {
      await supabase.from("updates").delete().eq("meeting_id", formData.id);
    }
    if (meetings.data) {
      const updates = formData.people.map((p) => ({
        meeting_id: meetings.data.id,
        person_name: p.name,
        order: formData.randomizeOnStart ? getRandomOrderValue() : +p.id,
      }));
      await supabase.from("updates").insert(updates);
      return redirect(`/${meetings.data.id}`);
    }
    return undefined;
  },
);
