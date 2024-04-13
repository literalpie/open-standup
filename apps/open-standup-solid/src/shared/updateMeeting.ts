import { StandupSeriesNoId } from "~/components/SeriesForm";
import { supabase } from "./supabase";
import { getRandomOrderValue } from "./getRandomOrderValue";
import { action, redirect } from "@solidjs/router";

export const updateMeeting = action(
  async (formData: StandupSeriesNoId & { id?: string }) => {
    // update/insert the updated meeting data
    const meetings = await supabase
      .from("meetings")
      .upsert({
        id: formData.id !== undefined ? +formData.id : undefined,
        title: formData.title,
        randomize_order: formData.randomizeOnStart,
      })
      .select("id,people(id, order)")
      .single();

    if (meetings.data) {
      // Update the meeting to include the people based on the form
      const peopleWithOrder = formData.people.map((p, index) => ({
        ...p,
        order: formData.randomizeOnStart ? getRandomOrderValue() : index,
      }));
      const existing = peopleWithOrder.filter((p) => p.id !== undefined);
      const newPeople = peopleWithOrder.filter(
        (p) => p.id === undefined && p.tempId !== undefined,
      );
      // delete anyone that exists in the current meeting, but isn't in the updated meeting.
      const deletedPeople = meetings.data.people
        .filter((ep) => !formData.people.some((fp) => +(fp.id ?? -1) === ep.id))
        .map((dp) => dp.id);
      const updateExisting = supabase.from("people").upsert(
        existing.map((p) => ({
          id: +p.id!,
          order: p.order,
          meeting_id: meetings.data.id,
          name: p.name,
        })),
      );
      const addNew = supabase.from("people").upsert(
        newPeople.map((p) => ({
          // TODO - order should be on updates. There can also be an order on people to represent the "non-randomized" order
          // when a meeting is updated, reset the current meeting_instance of this meeting
          order: p.order,
          meeting_id: meetings.data.id,
          name: p.name,
        })),
      );
      const deleteOld = supabase
        .from("people")
        .delete()
        .in("id", deletedPeople);

      // mark any current instances of this meeting as complete
      if (formData.id !== undefined) {
        await supabase
          .from("meeting_instances")
          .update({ complete: true })
          .eq("meeting_id", formData.id)
          .eq("complete", false);
      }
      // Create a new instance of this meeting and do people updates in parallel
      const newInstance = supabase
        .from("meeting_instances")
        .insert({ meeting_id: meetings.data.id })
        .select()
        .single();
      const [newInstanceResult] = await Promise.all([
        newInstance,
        deleteOld,
        updateExisting,
        addNew,
      ]);

      if (newInstanceResult.data) {
        // add updates for all people in the meeting to the new meeting instance
        const meetingPeople = await supabase
          .from("people")
          .select("id, order")
          .eq("meeting_id", meetings.data.id);
        meetingPeople.data &&
          (await supabase.from("updates").insert(
            meetingPeople.data.map((p) => ({
              order: formData.randomizeOnStart
                ? getRandomOrderValue()
                : p.order,
              meeting_instance_id: newInstanceResult.data!.id,
              person_id: p.id,
            })),
          ));
        return redirect(`/${meetings.data.id}`);
      }
    }
    return undefined;
  },
);
