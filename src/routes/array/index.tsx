import { component$, useSignal, useStore, useTask$ } from "@builder.io/qwik";

export default component$(() => {
  const firstItemName = useSignal("not set");
  const arrayStore = useStore(
    {
      theArray: [
        {
          name: "ben",
          done: false,
        },
        {
          name: "Joe",
          done: false,
        },
        {
          name: "Jim",
          done: false,
        },
        {
          name: "Bob",
          done: false,
        },
      ],
    },
    { recursive: true }
  );
  useTask$(({ track }) => {
    console.log("task");
    track(() => arrayStore.theArray[0]);
    firstItemName.value = `${arrayStore.theArray[0].name} done? ${
      arrayStore.theArray[0].done ? "yes" : "no"
    }`;
  });
  useTask$(({ track }) => {
    track(() => arrayStore.theArray.length);
    console.log("array changed");
  });
  return (
    <>
      {arrayStore.theArray.map((item) => (
        <div
          key={item.name}
          onClick$={() => {
            const itemIndex = arrayStore.theArray.indexOf(item);
            arrayStore.theArray[itemIndex] = { ...item, done: !item.done };
            item.done = !item.done;
          }}
        >
          {item.name} done? {item.done ? "yes" : "no"}
        </div>
      ))}
      <button
        onClick$={() => {
          // arrayStore.theArray = [
          //   ...arrayStore.theArray,
          //   { name: "new" + arrayStore.theArray.length, done: false },
          // ];
          arrayStore.theArray.push({ name: "new", done: false });
          console.log("array", arrayStore.theArray);
        }}
      >
        add
      </button>
      <div>
        <button
          onClick$={() => {
            arrayStore.theArray = arrayStore.theArray.filter(
              (item) => !item.done
            );
          }}
        >
          delete done
        </button>
      </div>
      <div>
        <button
          onClick$={() => {
            arrayStore.theArray[arrayStore.theArray.length - 1] = {
              name: "new last",
              done: false,
            };
          }}
        >
          replace last
        </button>
      </div>
      <div>
        first item:
        {firstItemName.value}
      </div>
    </>
  );
});
