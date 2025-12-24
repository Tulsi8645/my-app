
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import '@/models/User';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

export async function POST(request: Request) {
    try {
        const { query } = await request.json();

        if (!query) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // ---------------------------------------------------------
        // GEMINI AI INTEGRATION
        // ---------------------------------------------------------
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

                // Step 1: Detect Intent & Parameters
                const toolsPrompt = `
                You are an attendance assistant. Analyze this query: "${query}"
                
                Available Tools:
                1. get_attendance_today() - For queries about who is present/absent/late today
                2. get_stats() - For monthly statistics, stats, summary
                3. get_history() - For history, past records, last 7 days
                4. general_chat() - For greetings or unrelated questions

                Return ONLY a JSON object:
                {
                    "tool": "tool_name",
                    "reasoning": "why you chose this tool"
                }
                `;

                const result = await model.generateContent(toolsPrompt);
                const responseText = result.response.text();
                // Clean up markdown code blocks if present
                const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                const intent = JSON.parse(cleanJson);

                console.log('Gemini Intent:', intent);

                let dataContext = '';

                // Step 2: Execute Tool / Fetch Data
                if (intent.tool === 'get_attendance_today') {
                    const nepalDateStr = new Date().toLocaleDateString("en-US", {
                        timeZone: "Asia/Kathmandu",
                        year: 'numeric', month: '2-digit', day: '2-digit'
                    });
                    const [m, d, y] = nepalDateStr.split('/');
                    const utcBase = Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d));
                    const today = new Date(utcBase - (5.75 * 60 * 60 * 1000));

                    const records = await Attendance.find({ date: today }).populate('employeeId');

                    dataContext = JSON.stringify({
                        date: nepalDateStr,
                        total_records: records.length,
                        records: records.map((r: any) => ({
                            name: r.employeeId?.name,
                            email: r.employeeId?.email,
                            status: r.isAvailable ? 'PRESENT' : (r.clockOut ? 'CHECKED_OUT' : 'UNKNOWN'),
                            clockIn: r.clockIn,
                            clockOut: r.clockOut,
                            isOnTime: r.onTime,
                            sessions_count: r.sessions?.length || 0
                        }))
                    }, null, 2);
                }
                else if (intent.tool === 'get_stats') {
                    const startOfMonth = new Date();
                    startOfMonth.setDate(1);
                    startOfMonth.setHours(0, 0, 0, 0);
                    const records = await Attendance.find({ date: { $gte: startOfMonth } }).lean();

                    dataContext = JSON.stringify({
                        period: 'This Month',
                        stats: {
                            present_days: new Set(records.filter((r: any) => r.isAvailable || r.status === 'present').map((r: any) => new Date(r.date).toDateString())).size,
                            late_days: new Set(records.filter((r: any) => r.status === 'late' || !r.onTime).map((r: any) => new Date(r.date).toDateString())).size,
                            on_time_days: new Set(records.filter((r: any) => r.onTime).map((r: any) => new Date(r.date).toDateString())).size
                        }
                    }, null, 2);
                }
                else if (intent.tool === 'get_history') {
                    const records = await Attendance.find({}).sort({ date: -1 }).limit(7).populate('employeeId');
                    dataContext = JSON.stringify(records.map((r: any) => ({
                        date: r.date,
                        employee: r.employeeId?.name,
                        status: r.isAvailable ? 'PRESENT' : 'CHECKED_OUT',
                        isOnTime: r.onTime
                    })), null, 2);
                }

                // Step 3: Generate Natural Response
                if (intent.tool !== 'general_chat') {
                    const finalPrompt = `
                    Act as a helpful office attendance assistant.
                    
                    User Query: "${query}"
                    
                    Data Retrieved:
                    ${dataContext}
                    
                    Instructions:
                    1. Answer the user's question naturally using the data provided.
                    2. Use emojis (🟢, 🔴, ⏰, ✅) to make it readable.
                    3. Format names in **bold**.
                    4. Be concise but friendly.
                    5. Current time is ${new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })}.
                    `;

                    const finalResult = await model.generateContent(finalPrompt);
                    return NextResponse.json({ response: finalResult.response.text() });
                } else {
                    // General chat
                    const chatPrompt = `You are a helpful attendance assistant. Respond to this: "${query}"`;
                    const chatResult = await model.generateContent(chatPrompt);
                    return NextResponse.json({ response: chatResult.response.text() });
                }


            } catch (geminiError: any) {
                console.error('Gemini Error:', geminiError);
                if (geminiError.status === 429) {
                    // Specific handling for rate limits
                    // We don't return here, we let it fall through to legacy
                    // but we might want to inform the user if legacy also fails
                }
            }
        }

        // ---------------------------------------------------------
        // FALLBACK LEGACY LOGIC (Regex/Keywords)
        // ---------------------------------------------------------

        console.log('Using legacy keyword matching fallback...');
        const lowerQuery = query.toLowerCase();
        let response = '';

        // Get today's date in Nepal timezone
        const nepalDateStr = new Date().toLocaleDateString("en-US", {
            timeZone: "Asia/Kathmandu",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const [m, d, y] = nepalDateStr.split('/');
        const utcBase = Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d));
        const today = new Date(utcBase - (5.75 * 60 * 60 * 1000));

        // PRESENCE / ABSENCE CHECK
        if (
            lowerQuery.includes('who') &&
            (lowerQuery.includes('today') || lowerQuery.includes('now'))
        ) {
            const todayRecords = await Attendance.find({ date: today }).populate('employeeId');

            // "Who is absent?" / "missing"
            if (lowerQuery.includes('absent') || lowerQuery.includes('missing') || lowerQuery.includes('not here')) {
                const allUsers = await User.find({ role: 'employee' }); // Assuming role 'employee' exists
                const presentUserIds = todayRecords.map((r: any) => r.employeeId?._id.toString());
                const absentEmployees = allUsers.filter((u: any) => !presentUserIds.includes(u._id.toString()));

                if (absentEmployees.length === 0) {
                    response = '🎉 Everyone is present today!';
                } else {
                    response = `🚫 **Absent Today (${absentEmployees.length}):**\n\n`;
                    absentEmployees.forEach((u: any) => {
                        response += `• **${u.name}**\n`;
                    });
                }
            }
            // "Who is present?" / "here"
            else if (lowerQuery.includes('present') || lowerQuery.includes('here')) {
                if (todayRecords.length === 0) {
                    response = '❌ No attendance records found for today.';
                } else {
                    const presentEmployees = todayRecords.filter(r => r.isAvailable);
                    response += `🟢 **Currently Present (${presentEmployees.length}):**\n\n`;
                    presentEmployees.forEach((record: any) => {
                        const employee = record.employeeId;
                        const clockInTime = new Date(record.clockIn).toLocaleString("en-US", {
                            timeZone: "Asia/Kathmandu",
                            timeStyle: 'short'
                        });
                        response += `• **${employee?.name}** (${clockInTime})\n`;
                    });
                }
            }
            // "Who is late?"
            else if (lowerQuery.includes('late')) {
                const lateEmployees = todayRecords.filter(r => !r.onTime);
                if (lateEmployees.length === 0) {
                    response = '🎉 No one is late today!';
                } else {
                    response = `⏰ **Late Arrivals (${lateEmployees.length}):**\n\n`;
                    lateEmployees.forEach((record: any) => {
                        response += `• **${record.employeeId?.name}**\n`;
                    });
                }
            }
        }
        // Handle "stats" or "statistics" queries
        else if (lowerQuery.includes('stat')) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const records = await Attendance.find({
                date: { $gte: startOfMonth }
            }).lean();

            const stats = {
                present: new Set(records.filter(r => r.isAvailable || r.status === 'present' || r.status === 'late').map(r => new Date(r.date).toDateString())).size,
                late: new Set(records.filter(r => r.status === 'late' || (r.onTime === false)).map(r => new Date(r.date).toDateString())).size,
                onTime: new Set(records.filter(r => r.onTime).map(r => new Date(r.date).toDateString())).size
            };

            response = `📊 **Monthly Attendance Statistics**\n\n`;
            response += `📅 Month: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}\n\n`;
            response += `✅ Days Present: ${stats.present}\n`;
            response += `⏰ Days Late: ${stats.late}\n`;
            response += `🟢 Days On Time: ${stats.onTime}\n`;
        }
        // Handle "history" queries
        else if (lowerQuery.includes('history')) {
            const records = await Attendance.find({})
                .sort({ date: -1 })
                .limit(7)
                .populate('employeeId')
                .lean();

            if (records.length === 0) {
                response = '❌ No attendance history found.';
            } else {
                response = `📅 **Attendance History (Last 7 Days)**\n\n`;

                records.forEach((record: any) => {
                    const date = new Date(record.date).toLocaleDateString('en-US', {
                        timeZone: 'Asia/Kathmandu',
                        dateStyle: 'medium'
                    });
                    const employee = record.employeeId;
                    const status = record.isAvailable ? '🟢 Present' : '🔴 Checked Out';
                    const onTime = record.onTime ? '✅ On Time' : '⏰ Late';

                    response += `**${date}** - ${employee?.name}\n`;
                    response += `Status: ${status} | ${onTime}\n`;
                    response += `Sessions: ${record.sessions?.length || 0}\n\n`;
                });
            }
        }
        // Handle "help" queries
        else if (lowerQuery.includes('help')) {
            response = `🤖 **MCP Server Help**\n\n`;
            response += `I can help you with the following queries:\n\n`;
            response += `• "Who is present today?"\n`;
            response += `• "Who is absent today?"\n`;
            response += `• "Show me stats"\n`;
            response += `• "Get history"\n`;
        }

        // If response is still empty, return a generic fallback message
        if (!response) {
            if (genAI) {
                response = `⚠️ **AI Busy (Rate Limit):**\nI'm having trouble connecting to the AI brain right now (System is busy). \n\n**Try these simple commands instead:**\n• "Who is present?"\n• "Who is absent?"\n• "Stats"`;
            } else {
                response = `⚠️ **No AI Key:**\nGemini API Key is missing. I can only understand simple commands like:\n• "Who is present?"\n• "Stats"\n• "History"`;
            }
        }

        return NextResponse.json({ response });

    } catch (error) {
        console.error('MCP Query Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', response: '❌ Error processing your query. Please try again.' },
            { status: 500 }
        );
    }
}
