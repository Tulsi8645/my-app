import { ArrowDownIcon, ArrowUpIcon } from "@admin/assets/icons";
import { cn } from "@/lib/utils";
import type { JSX, SVGProps } from "react";

type PropsType = {
  label: string;
  data: {
    value: number | string;
    growthRate: number;
    names?: string[]; // Optional array of names
  };
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
};

export function OverviewCard({ label, data, Icon }: PropsType) {
  const isDecreasing = data.growthRate < 0;

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
      <Icon />

      <div className="mt-6 flex items-end justify-between">
        <dl>
          <dt className="mb-1.5 text-heading-6 font-bold text-dark dark:text-white">
            {data.value}
          </dt>

          <dd className="text-sm font-medium text-dark-6">{label}</dd>

          {data.names && data.names.length > 0 && (
            <dd className="mt-2 text-xs text-gray-500">
              {data.names.slice(0, 3).join(", ")}
              {data.names.length > 3 && ` +${data.names.length - 3} more`}
            </dd>
          )}

        </dl>

        <dl
          className={cn(
            "text-sm font-medium",
            isDecreasing ? "text-red" : "text-green",
          )}
        >
          <dt className="flex items-center gap-1.5">
            {data.growthRate}%
            {isDecreasing ? (
              <ArrowDownIcon aria-hidden />
            ) : (
              <ArrowUpIcon aria-hidden />
            )}
          </dt>

          <dd className="sr-only">
            {label} {isDecreasing ? "Decreased" : "Increased"} by{" "}
            {data.growthRate}%
          </dd>
        </dl>
      </div>
    </div>
  );
}
