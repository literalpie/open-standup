import { useNavigate } from "@solidjs/router";
import { SeriesForm } from "~/components/SeriesForm";
import { updateMeeting } from "~/shared/updateMeeting";

export default function NewStandupComponent() {
  const navigate = useNavigate();

  return (
    <SeriesForm
      onSubmit={async (formData) => {
        const id = await updateMeeting(formData);
        navigate(`/${id}`);
      }}
    />
  );
}
