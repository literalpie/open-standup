import { component$, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, routeLoader$, useNavigate } from "@builder.io/qwik-city";

export const useEnv = routeLoader$((a) => {
  return a.env.get("PUBLIC_SUPABASE_URL");
});

export default component$(() => {
  const env = useEnv();
  const nav = useNavigate();
  useVisibleTask$(() => {
    nav("/1");
  });
  return (
    <>
      <div>env: {env.value}</div>
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
