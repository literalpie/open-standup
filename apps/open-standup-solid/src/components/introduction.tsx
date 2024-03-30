import { A } from "@solidjs/router";

export default function Introduction() {
  return (
    <>
      <h2 class="font-bold text-lg p-1">Welcome!</h2>
      <p>
        This is Open Standup. An app to help teams have quick and simple sync
        meetings.
      </p>
      <p>Play with the demo below, or make your own meeting</p>
      <div class="flex justify-center py-1">
        <A href={"/new"} class="btn btn-neutral w-1/2">
          Create new standup
        </A>
      </div>
      <details>
        <summary class="cursor-pointer">How does it work?</summary>
        <p>
          The name of the currently updating person is highlighted in blue. The
          name of anyone who has already done their update is highlighted in
          green.
        </p>

        <p>
          Anyone in the world who is viewing the demo at the same time will see
          the same state that you see. Try using the buttons to change which
          participant is currently updating.
        </p>
      </details>
    </>
  );
}
