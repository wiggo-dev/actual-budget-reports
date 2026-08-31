"use client";

type Point = { value: number };

export function Spark({
  points,
  color = "#0f766e",
  fill = "rgba(15,118,110,0.12)",
  height = 120,
}: {
  points: Point[];
  color?: string;
  fill?: string;
  height?: number;
}) {
  const width = 560;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const coords = values.map((value, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((value - min) / span) * (height - 8) - 4;
    return `${x},${y}`;
  });
  const line = coords.join(" ");
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polygon points={area} fill={fill} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Bars({
  items,
  color = "#0f766e",
}: {
  items: { name: string; amount: number }[];
  color?: string;
}) {
  const max = Math.max(...items.map((item) => item.amount));

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.name}
          className="grid grid-cols-[7rem_1fr_4rem] items-center gap-3 text-sm"
        >
          <span className="truncate">{item.name}</span>
          <div className="h-2 overflow-hidden rounded-full bg-black/8">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(item.amount / max) * 100}%`,
                background: color,
              }}
            />
          </div>
          <span className="text-right tabular-nums">
            £{item.amount.toLocaleString("en-GB")}
          </span>
        </div>
      ))}
    </div>
  );
}
