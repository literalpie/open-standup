export default function PersonStatus(props: {
  name: string;
  done: boolean;
  current: boolean;
  optimistic?: boolean;
}) {
  return (
    <div
      class="transition px-2 duration-500"
      classList={{
        "bg-success text-success-content": props.done,
        "bg-info text-info-content": props.current,
        "opacity-75": props.optimistic,
      }}
    >
      {props.name}
    </div>
  );
}
