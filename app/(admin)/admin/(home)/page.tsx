import { Suspense } from "react";
import { OverviewCardsGroup } from "./_components/overview-cards";
import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";
import { getAttendanceLogs, getOverviewData } from "./fetch";
import { AttendanceTable } from "./_components/attendance-table";
import AttendanceChart from "../components/Charts/AttendanceChart";
import AttendanceTimeline from "../components/Charts/AttendanceTimeline";

interface HomeProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function Home(props: HomeProps) {
  const searchParams = await props.searchParams;
  const date = searchParams?.date;
  const overviewData = await getOverviewData(date);

  return (
    <>
      <Suspense fallback={<OverviewCardsSkeleton />}>
        <OverviewCardsGroup data={overviewData} />
      </Suspense>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5">
        <AttendanceTimeline
          series={overviewData.timelineData.series}
          selectedDate={overviewData.date || date}
        />

      </div>
    </>
  );
}
