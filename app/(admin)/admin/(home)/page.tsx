import { Suspense } from "react";
import { OverviewCardsGroup } from "./_components/overview-cards";
import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";
import { getAttendanceLogs, getOverviewData } from "./fetch";
import { AttendanceTable } from "./_components/attendance-table";
import AttendanceChart from "../components/Charts/AttendanceChart";
import AttendanceTimeline from "../components/Charts/AttendanceTimeline";

export default async function Home() {
  const [logs, overviewData] = await Promise.all([
    getAttendanceLogs(),
    getOverviewData()
  ]);

  return (
    <>
      <Suspense fallback={<OverviewCardsSkeleton />}>
        <OverviewCardsGroup data={overviewData} />
      </Suspense>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5">
        <AttendanceTimeline
          series={overviewData.timelineData.series}
        />
        <div className="col-span-12">
          <AttendanceTable logs={logs} />
        </div>
      </div>
    </>
  );
}
