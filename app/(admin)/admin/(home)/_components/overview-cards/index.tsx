import { OverviewCard } from "./card";
import { TimeWidget } from "../time-widget";
import * as icons from "./icons";

interface OverviewCardsGroupProps {
  data: {
    views: any;
    profit: any;
    products: any;
    users: any;
    totalHours: any;
  }
}

export function OverviewCardsGroup({ data }: OverviewCardsGroupProps) {
  const { views, profit, products, users, totalHours } = data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <OverviewCard
        label="Present Today"
        data={{
          ...views,
          value: views.value.toString(),
        }}
        Icon={icons.Views}
      />

      <OverviewCard
        label="Late Today"
        data={{
          ...profit,
          value: profit.value.toString(),
        }}
        Icon={icons.Profit}
      />

      <TimeWidget name="Tecobit" />
    </div>
  );
}
