import { component$, Slot, createContext } from "@builder.io/qwik";
import { Person } from "~/shared/types";
import Header from "../components/header/header";

export const standupStatesContext =
  createContext<Record<string, Person[]>>("standup-state");

export default component$(() => {
  return (
    <>
      <main>
        <Header />
        <section>
          <Slot />
        </section>
      </main>
      <footer>
        <a href="https://www.literalpie.com/" target="_blank">
          Made with ♡ by Ben
        </a>
      </footer>
    </>
  );
});
