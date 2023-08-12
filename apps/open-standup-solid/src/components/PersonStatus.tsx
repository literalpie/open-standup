export default function PersonStatus({
  name,
  done,
  current,
  optimistic,
}: {
  name: string;
  done: boolean;
  current: boolean;
  optimistic?: boolean;
}) {
  return (
    <div
      class="transition px-2 duration-1000"
      classList={{
        "bg-success text-success-content": done,
        "bg-info text-info-content": current,
        "opacity-75": optimistic,
      }}
    >
      {name}
    </div>
  );
}
