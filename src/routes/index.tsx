import { component$, useStore } from "@builder.io/qwik";
import { DocumentHead, Link } from "@builder.io/qwik-city";
import { StandupComponent } from "~/components/standup-component/standup-component";
import { useSyncedStandupState } from "~/hooks/useSyncedStandupState";
import { Person, StandupSeries } from "~/shared/types";

export const makeInitialPeopleState = (names: string[]): Person[] =>
  names.map((name, index) => ({ name, order: index, id: String(index) }));

export const initialPeople = makeInitialPeopleState([
  "Ben",
  "Chaz",
  "Jason",
  "Jerry",
  "Joe",
  "Juana",
  "Luke",
  "Zack",
]);

export default component$(() => {
  const seriesState = useStore<StandupSeries>({
    id: "demo",
    people: initialPeople,
    randomizeOnStart: false,
    title: "Demo Meeting",
  });
  const standupState = useSyncedStandupState(seriesState);
  return (
    <div>
      <h2 class="font-bold text-lg p-1">Welcome!</h2>
      <p class="py-1">
        This is Open Standup. An app to help teams have quick and simple sync
        meetings.
      </p>
      <p class="py-1">Play with the demo below, or make your own meeting</p>
      <div class="flex justify-center py-1">
        <Link href="/new" class="btn btn-neutral w-1/2">
          Create new standup
        </Link>
      </div>
      <details>
        <summary class="cursor-pointer">How does it work?</summary>
        <p class="py-1">
          The name of the currently updating person is highlighted in blue. The
          name of anyone who has already done their update is highlighted in
          green. Anyone in the world who is viewing the demo at the same time
          will see the same state that you see. Try using the buttons to change
          which participant is currently updating.
        </p>
        <p class="py-1">
          Anyone in the world who is viewing the demo at the same time will see
          the same state that you see. Try using the buttons to change which
          participant is currently updating.
        </p>
        <p class="py-1">
          The state of the meeting is also saved locally. This means if you
          close the page and come back later in the same browser, you can pick
          up where you left off. However, if anyone visits the page in a
          different browser that hasn't already been synced and there isn't
          anyone currently "hosting" the updated meeting, they will start with a
          new meeting.
        </p>
      </details>
      <section class="py-4">
        <h2 class="font-bold text-lg text-center">{seriesState.title}</h2>
        <StandupComponent
          seriesState={seriesState}
          standupState={standupState}
        />
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Open Standup",
  meta: [
    {
      name: "name",
      content: "description",
    },
  ],
};
