import { useAction, useParams } from "@solidjs/router";
import { SeriesForm, StandupSeriesNoId } from "~/components/SeriesForm";
import { updateMeeting } from "~/shared/updateMeeting";
import { useStandupState, SeriesState } from "~/shared/useStandupState";
import { createMemo } from "solid-js";

/** Map the real-time SeriesState into the form's expected shape. */
function toFormSeries(
  series: SeriesState | undefined,
): StandupSeriesNoId | undefined {
  if (!series) return undefined;
  return {
    title: series.title,
    randomizeOnStart: series.randomizeOnStart,
    people: series.people.map((p) => ({
      id: p._id,
      name: p.name,
      order: p.order,
    })),
  };
}

export default function EditStandupMeetingComponent() {
  const params = useParams();
  const meetingId = params["standupId"];
  const standup = useStandupState(meetingId);

  const action = useAction(updateMeeting);
  const formSeries = createMemo(() => toFormSeries(standup.seriesState()));

  return (
    <SeriesForm
      onSubmit={(series) => {
        action({ ...series, id: meetingId });
      }}
      initialSeries={formSeries()}
    />
  );
}
