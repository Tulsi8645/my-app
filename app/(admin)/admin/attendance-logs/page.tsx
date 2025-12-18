import { AttendanceTable } from "../(home)/_components/attendance-table";
import { getAttendanceLogs } from "../(home)/fetch";

export const metadata = {
    title: "Attendance Logs | Tecobit Technology",
};

export default async function AttendanceLogsPage() {
    const logs = await getAttendanceLogs();

    return (
        <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-10">
                <AttendanceTable logs={logs} />
            </div>
        </div>
    );
}
