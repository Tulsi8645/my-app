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

  const borderClass = label.includes("Present")
    ? "border-l-4 border-green-500"
    : label.includes("Late")
      ? "border-l-4 border-yellow-500"
      : "border-l-4 border-primary";

  return (
    <div className={cn("relative rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark group hover:shadow-2 hover:z-30 transition-all", borderClass)}>
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-meta-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        {/* Growth Rate / Trend */}
        <div className={cn("flex items-center gap-1 text-sm font-bold", isDecreasing ? "text-red-500" : "text-green-500")}>
          {data.growthRate}%
          {isDecreasing ? <ArrowDownIcon className="h-3 w-3" /> : <ArrowUpIcon className="h-3 w-3" />}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-3xl font-bold text-dark dark:text-white">
          {data.value}
        </h3>
        <p className="mt-1 font-medium text-gray-500 dark:text-gray-400">{label}</p>

        {/* Hover Popover for Names */}
        {data.names && data.names.length > 0 && (
          <div className="absolute left-0 top-full z-999 w-full min-w-[200px] pt-2 opacity-0 transition-all duration-300 invisible group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 pointer-events-none group-hover:pointer-events-auto">
            <div className="rounded-[10px] bg-white p-4 shadow-xl dark:bg-gray-dark border border-stroke dark:border-strokedark">
              <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Employees:</p>
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                {data.names.map((name, i) => (
                  <span key={i} className="text-sm font-medium text-black dark:text-white">
                    • {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

