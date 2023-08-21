import { createRouteAction, useParams } from "solid-start";
import { SeriesForm } from "~/components/SeriesForm";
import { updateMeeting } from "~/shared/updateMeeting";
import { useStandupState } from "~/shared/useStandupState";

export default function EditStandupMeetingComponent() {
  const params = useParams();
  const standupId = params.standupId;
  const standupQuery = useStandupState(standupId);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, action] = createRouteAction(updateMeeting);
  return (
    <SeriesForm
      onSubmit={(series) => {
        action({ ...series, id: standupId });
      }}
      series={standupQuery.seriesState()}
    />
  );
}
