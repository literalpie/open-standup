import { createRouteAction } from "solid-start";
import { SeriesForm } from "~/components/SeriesForm";
import { updateMeeting } from "~/shared/updateMeeting";

export default function EditStandupMeetingComponent() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, action] = createRouteAction(updateMeeting);
  return <SeriesForm onSubmit={action} />;
}
