import type { RequestEventBase } from "@builder.io/qwik-city";
import { server$ } from "@builder.io/qwik-city";
import { createServerClient } from "supabase-auth-helpers-qwik";
import type { Database } from "~/shared/db-types";

export const getSbClient = server$((context: RequestEventBase<unknown>) => {
  return createServerClient<Database>(
    context.env.get("PUBLIC_SUPABASE_URL")!,
    context.env.get("PUBLIC_SUPABASE_ANON_KEY")!,
    context
  );
});
