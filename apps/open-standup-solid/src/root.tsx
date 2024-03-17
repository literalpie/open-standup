// @refresh reload
import { Suspense } from "solid-js";
import {
  A,
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from "solid-start";
import "./root.css";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { Themer } from "./components/Themer";

export default function Root() {
  const queryClient = new QueryClient();
  return (
    <Html lang="en">
      <Head>
        <Title>SolidStart - Bare</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
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
                  <Routes>
                    <FileRoutes />
                  </Routes>
                </div>
              </main>
            </QueryClientProvider>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
