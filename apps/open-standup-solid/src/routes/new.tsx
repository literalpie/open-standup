import { useAction } from "@solidjs/router";
import { SeriesForm } from "~/components/SeriesForm";
import { updateMeeting } from "~/shared/updateMeeting";

export default function EditStandupMeetingComponent() {
  const action = useAction(updateMeeting);
  return <SeriesForm onSubmit={action} />;
}
