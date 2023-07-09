import { component$, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, useNavigate } from "@builder.io/qwik-city";

export default component$(() => {
  const nav = useNavigate();
  useVisibleTask$(() => {
    nav("/1");
  });
  return (
    <>
      This is the home page. See a demo standup meeting{" "}
      <Link href="/1" class="link">
        Here
      </Link>
      !
    </>
  );
});

export const head: DocumentHead = {
  title: "Open Standup",
  meta: [
    {
      name: "description",
      content: "Organize daily update meetings with your team.",
    },
  ],
};
