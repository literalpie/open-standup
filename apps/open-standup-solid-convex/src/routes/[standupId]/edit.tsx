import { useNavigate, useParams } from "@solidjs/router";
import { SeriesForm, StandupSeriesNoId } from "~/components/SeriesForm";
import { updateMeeting } from "~/shared/updateMeeting";
import { useStandupState, SeriesState } from "~/shared/useStandupState";
import { Show } from "solid-js";

function toFormSeries(series: SeriesState): StandupSeriesNoId {
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
  const navigate = useNavigate();

  const handleSubmit = async (formData: StandupSeriesNoId) => {
    const id = await updateMeeting({ ...formData, id: meetingId });
    navigate(`/${id}`);
  };

  return (
    <Show when={standup.seriesState()} fallback={<div>Loading...</div>}>
      {(series) => (
        <SeriesForm
          onSubmit={handleSubmit}
          initialSeries={toFormSeries(series())}
        />
      )}
    </Show>
  );
}
