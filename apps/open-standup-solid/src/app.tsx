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
            <header class="p-2 border-b-2 sticky top-0 bg-base-100 flex flex-row justify-between">
              <div class="w-24" />
              <h1 class="font-bold text-xl">
                <A href="/">Open Standup</A>
              </h1>
              <div class="w-24">
                <Themer />
              </div>
            </header>
            <main class="flex justify-center">
              <div class="flex-grow p-2 max-w-4xl">
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
