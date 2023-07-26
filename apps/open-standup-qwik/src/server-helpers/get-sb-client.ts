import type { RequestEventBase } from "@builder.io/qwik-city";
import { server$ } from "@builder.io/qwik-city";
import { createServerClient } from "supabase-auth-helpers-qwik";
import type { Database } from "~/shared/db-types";

export const getSbClient = server$((context: RequestEventBase<unknown>) => {
  console.log("get sb client ", import.meta.env.PUBLIC_SUPABASE_URL);
  return createServerClient<Database>(
    context.env.get("PUBLIC_SUPABASE_URL") ??
      "https://tbxhyxckwpqjqadqsehu.supabase.co/",
    context.env.get("PUBLIC_SUPABASE_ANON_KEY") ??
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieGh5eGNrd3BxanFhZHFzZWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODg0ODk4NDksImV4cCI6MjAwNDA2NTg0OX0.BN4nSodYgrBMqt1UWrSRAdPZc9-0j6-x6O_g2ectrAU",
    context,
  );
});
