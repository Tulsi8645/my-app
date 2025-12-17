import { AttendanceTable } from "../(home)/_components/attendance-table";
import { getAttendanceLogs } from "../(home)/fetch";

export const metadata = {
    title: "Attendance Logs | Tecobit Technology",
};

export default async function AttendanceLogsPage() {
    const logs = await getAttendanceLogs();

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-title-md2 font-bold text-black dark:text-white">
                    Attendance Logs
                </h2>
            </div>
            <div className="flex flex-col gap-10">
                <AttendanceTable logs={logs} />
            </div>
        </div>
    );
}
