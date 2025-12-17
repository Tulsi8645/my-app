import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import User from "@/models/User";
import mongoose from "mongoose";

export async function getOverviewData() {
  await connectDB();

  // 1. Total Users (Employees)
  const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } }); // Assuming 'user' or just not admin

  // 2. Attendance Today
  const nepalDateStr = new Date().toLocaleDateString("en-US", {
    timeZone: "Asia/Kathmandu",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const today = new Date(nepalDateStr);
  today.setHours(0, 0, 0, 0);

  // We need to lookup user names for the attendance records
  // Using aggregate to join with users
  const todayRecords = await Attendance.aggregate([
    {
      $match: {
        date: today
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "employeeId",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        status: 1,
        employeeId: 1,
        sessions: 1,
        employeeName: { $ifNull: ["$user.name", "Unknown"] }
      }
    }
  ]);

  const presentRecords = todayRecords.filter((r: any) => r.status === 'present');
  const lateRecords = todayRecords.filter((r: any) => r.status === 'late');

  const presentCount = presentRecords.length;
  const lateCount = lateRecords.length;
  // Absent is roughly Total - (Present + Late)
  const checkedInCount = presentCount + lateCount;
  const absentCount = Math.max(0, totalUsers - checkedInCount);

  // Extract names
  const presentNames = presentRecords.map((r: any) => r.employeeName);
  const lateNames = lateRecords.map((r: any) => r.employeeName);

  // 3. Total Hours Logged (All Time or This Month)
  const totalHoursResult = await Attendance.aggregate([
    { $unwind: "$sessions" },
    { $match: { "sessions.checkOut": { $exists: true, $ne: null } } },
    {
      $project: {
        duration: {
          $subtract: [new Date("$sessions.checkOut"), new Date("$sessions.checkIn")]
        }
      }
    },
    {
      $group: {
        _id: null,
        totalHours: { $sum: "$duration" }
      }
    }
  ]);

  const totalMilliseconds = totalHoursResult[0]?.totalHours || 0;
  const totalHours = Math.round(totalMilliseconds / (1000 * 60 * 60));

  // 4. Monthly Stats for Chart (Last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const monthlyStats = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: thirtyDaysAgo }
      }
    },
    { $unwind: "$sessions" },
    { $match: { "sessions.checkOut": { $exists: true, $ne: null } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        dailyHours: {
          $sum: {
            $divide: [
              { $subtract: [new Date("$sessions.checkOut"), new Date("$sessions.checkIn")] },
              1000 * 60 * 60
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const chartData = {
    series: [{
      name: "Hours Worked",
      data: monthlyStats.map((s: any) => s.dailyHours.toFixed(1))
    }],
    categories: monthlyStats.map((s: any) => s._id)
  };

  // 5. Timeline Data for Today (Range Bar)
  // Re-using todayRecords and totalUsers logic somewhat
  // We need to map ALL users to their sessions for the chart
  const allUsers = await User.find({ role: { $ne: 'admin' } }).lean();

  // Create a map of attendance by employee ID string
  const attendanceMap = new Map();
  todayRecords.forEach((record: any) => {
    attendanceMap.set(record.employeeId.toString(), record);
  });

  const timelineSeriesData: any[] = [];

  allUsers.forEach((user: any) => {
    const record: any = attendanceMap.get(user._id.toString());
    if (record && record.sessions && record.sessions.length > 0) {
      record.sessions.forEach((session: any) => {
        let start = new Date(session.checkIn).getTime();
        let end = session.checkOut ? new Date(session.checkOut).getTime() : Date.now();

        // Handle open session (active)
        // ApexCharts RangeBar needs [min, max]

        timelineSeriesData.push({
          x: user.name,
          y: [start, end],
          fillColor: session.checkOut ? '#3C50E0' : '#10B981' // Blue for completed, Green for active
        });
      });
    } else {
      // Optional: Add a dummy point if we want to show the name on the axis, 
      // but typically timeline shows activity.
      // We will skip absent users in the chart to save space/clutter, 
      // as the table shows them as 'Absent'.
    }
  });

  const timelineData = {
    series: [
      {
        name: 'Sessions',
        data: timelineSeriesData
      }
    ]
  };

  return {
    views: { // Present
      value: presentCount,
      growthRate: 0,
      names: presentNames
    },
    profit: { // Late
      value: lateCount,
      growthRate: 0,
      names: lateNames
    },
    products: { // Absent
      value: absentCount,
      growthRate: 0,
    },
    users: { // Total Users
      value: totalUsers,
      growthRate: 0,
    },
    totalHours: {
      value: totalHours,
      growthRate: 0
    },
    chartData,
    timelineData // New field
  };
}

export async function getChatsData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      name: "Jacob Jones",
      profile: "/images/user/user-01.png",
      isActive: true,
      lastMessage: {
        content: "See you tomorrow at the meeting!",
        type: "text",
        timestamp: "2024-12-19T14:30:00Z",
        isRead: false,
      },
      unreadCount: 3,
    },
    {
      name: "Wilium Smith",
      profile: "/images/user/user-03.png",
      isActive: true,
      lastMessage: {
        content: "Thanks for the update",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "Johurul Haque",
      profile: "/images/user/user-04.png",
      isActive: false,
      lastMessage: {
        content: "What's up?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "M. Chowdhury",
      profile: "/images/user/user-05.png",
      isActive: false,
      lastMessage: {
        content: "Where are you now?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 2,
    },
    {
      name: "Akagami",
      profile: "/images/user/user-07.png",
      isActive: false,
      lastMessage: {
        content: "Hey, how are you?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
  ];

}

export async function getAttendanceLogs() {
  await connectDB();

  // 1. Define Today
  const nepalDateStr = new Date().toLocaleDateString("en-US", {
    timeZone: "Asia/Kathmandu",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const today = new Date(nepalDateStr);
  today.setHours(0, 0, 0, 0);

  // 2. Fetch all employees
  const users = await User.find({ role: { $ne: 'admin' } }).lean();

  // 3. Fetch attendance for today
  const attendanceRecords = await Attendance.find({
    date: today
  }).lean();

  // 4. Map records by employeeId for easy lookup
  // Note: employeeId in Attendance is ObjectId, user._id is ObjectId
  const attendanceMap = new Map();
  attendanceRecords.forEach((record: any) => {
    attendanceMap.set(record.employeeId.toString(), record);
  });

  // 5. Build the result list
  const logs = users.map((user: any) => {
    const record: any = attendanceMap.get(user._id.toString());
    const sessions = record?.sessions || [];
    const firstSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];

    return {
      id: user._id.toString(), // Use user ID as key since record might not exist
      employeeName: user.name,
      department: user.department || 'N/A',
      role: user.role,
      date: today.toLocaleDateString(),
      checkIn: firstSession ? new Date(firstSession.checkIn).toLocaleTimeString() : '-',
      checkOut: (lastSession && lastSession.checkOut) ? new Date(lastSession.checkOut).toLocaleTimeString() : (firstSession ? 'Active' : '-'),
      status: record?.status || 'absent',
      location: firstSession?.address || 'Unknown'
    };
  });

  return logs;
}