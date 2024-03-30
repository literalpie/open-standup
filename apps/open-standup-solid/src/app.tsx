// @refresh reload
import { MetaProvider, Title } from "@solidjs/meta";
import { Router, A } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { Suspense } from "solid-js";
import { Themer } from "./components/Themer";
import "./app.css";

export default function App() {
  const queryClient = new QueryClient();

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>SolidStart - Basic</Title>
          <QueryClientProvider client={queryClient}>
            <header class="bg-base-100 sticky top-0 flex flex-row justify-between border-b-2 p-2">
              <div class="w-24" />
              <h1 class="text-xl font-bold">
                <A href="/">Open Standup</A>
              </h1>
              <div class="w-24">
                <Themer />
              </div>
            </header>
            <main class="flex justify-center">
              <div class="max-w-4xl flex-grow p-2">
                <Suspense fallback={"loading"}>{props.children}</Suspense>
              </div>
            </main>
          </QueryClientProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
