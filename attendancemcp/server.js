#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';

// Configuration - Attendance API base URL
const ATTENDANCE_API_BASE_URL = process.env.ATTENDANCE_API_URL || 'http://localhost:3000/api/attendance';

class AttendanceMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: "attendance-mcp-server",
                version: "0.1.0",
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();
    }

    setupToolHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "checkin",
                        description: "Check in an employee at their current location",
                        inputSchema: {
                            type: "object",
                            properties: {
                                employeeId: {
                                    type: "string",
                                    description: "Employee ID (required)",
                                },
                                latitude: {
                                    type: "number",
                                    description: "Latitude coordinate (required)",
                                },
                                longitude: {
                                    type: "number",
                                    description: "Longitude coordinate (required)",
                                },
                                address: {
                                    type: "string",
                                    description: "Human-readable address (optional)",
                                },
                            },
                            required: ["employeeId", "latitude", "longitude"],
                        },
                    },
                    {
                        name: "checkout",
                        description: "Check out an employee at their current location",
                        inputSchema: {
                            type: "object",
                            properties: {
                                employeeId: {
                                    type: "string",
                                    description: "Employee ID (required)",
                                },
                                latitude: {
                                    type: "number",
                                    description: "Latitude coordinate (required)",
                                },
                                longitude: {
                                    type: "number",
                                    description: "Longitude coordinate (required)",
                                },
                                address: {
                                    type: "string",
                                    description: "Human-readable address (optional)",
                                },
                            },
                            required: ["employeeId", "latitude", "longitude"],
                        },
                    },
                    {
                        name: "get_stats",
                        description: "Get attendance statistics for an employee (monthly summary)",
                        inputSchema: {
                            type: "object",
                            properties: {
                                employeeId: {
                                    type: "string",
                                    description: "Employee ID (required)",
                                },
                            },
                            required: ["employeeId"],
                        },
                    },
                    {
                        name: "get_history",
                        description: "Get attendance history for an employee (last 7 days)",
                        inputSchema: {
                            type: "object",
                            properties: {
                                employeeId: {
                                    type: "string",
                                    description: "Employee ID (required)",
                                },
                            },
                            required: ["employeeId"],
                        },
                    },
                    {
                        name: "get_today_status",
                        description: "Check if an employee is currently checked in today",
                        inputSchema: {
                            type: "object",
                            properties: {
                                employeeId: {
                                    type: "string",
                                    description: "Employee ID (required)",
                                },
                            },
                            required: ["employeeId"],
                        },
                    },
                ],
            };
        });

        // Tool handlers
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case "checkin":
                        return await this.checkin(args);
                    case "checkout":
                        return await this.checkout(args);
                    case "get_stats":
                        return await this.getStats(args);
                    case "get_history":
                        return await this.getHistory(args);
                    case "get_today_status":
                        return await this.getTodayStatus(args);
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            } catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
            }
        });
    }

    // API request helper
    async makeApiRequest(method, endpoint, data = null) {
        const config = {
            method,
            url: `${ATTENDANCE_API_BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            config.data = data;
        }

        try {
            const response = await axios(config);
            return response.data;
        } catch (error) {
            if (error.response) {
                throw new Error(`API Error: ${error.response.status} - ${error.response.data.error || error.response.statusText}`);
            } else if (error.request) {
                throw new Error('Network Error: Could not connect to attendance API');
            } else {
                throw new Error(`Request Error: ${error.message}`);
            }
        }
    }

    async checkin(args) {
        const { employeeId, latitude, longitude, address = '' } = args;

        const checkInData = {
            employeeId,
            latitude,
            longitude,
            address,
            timestamp: new Date().toISOString(),
            type: 'checkin',
        };

        const result = await this.makeApiRequest('POST', '/checkin', checkInData);
        return {
            content: [
                {
                    type: "text",
                    text: `✅ Check-in successful!\n${JSON.stringify(result, null, 2)}`,
                },
            ],
        };
    }

    async checkout(args) {
        const { employeeId, latitude, longitude, address = '' } = args;

        const checkOutData = {
            employeeId,
            latitude,
            longitude,
            address,
            timestamp: new Date().toISOString(),
            type: 'checkout',
        };

        const result = await this.makeApiRequest('POST', '/checkin', checkOutData);
        return {
            content: [
                {
                    type: "text",
                    text: `✅ Check-out successful!\n${JSON.stringify(result, null, 2)}`,
                },
            ],
        };
    }

    async getStats(args) {
        const { employeeId } = args;
        const params = new URLSearchParams({ employeeId });

        const result = await this.makeApiRequest('GET', `/stats?${params.toString()}`);

        return {
            content: [
                {
                    type: "text",
                    text: `📊 Attendance Statistics (This Month):\n${JSON.stringify(result, null, 2)}`,
                },
            ],
        };
    }

    async getHistory(args) {
        const { employeeId } = args;
        const params = new URLSearchParams({ employeeId });

        const result = await this.makeApiRequest('GET', `/history?${params.toString()}`);

        return {
            content: [
                {
                    type: "text",
                    text: `📅 Attendance History (Last 7 Days):\n${JSON.stringify(result, null, 2)}`,
                },
            ],
        };
    }

    async getTodayStatus(args) {
        const { employeeId } = args;

        // Get today's history and check the latest session
        const params = new URLSearchParams({ employeeId });
        const result = await this.makeApiRequest('GET', `/history?${params.toString()}`);

        if (!result.records || result.records.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ No attendance records found for employee ${employeeId}`,
                    },
                ],
            };
        }

        // Get today's record (first one since history is sorted by date desc)
        const todayRecord = result.records[0];
        const isCheckedIn = todayRecord.isAvailable || false;
        const status = todayRecord.status || 'unknown';

        const statusEmoji = isCheckedIn ? '🟢' : '🔴';
        const statusText = isCheckedIn ? 'CHECKED IN' : 'CHECKED OUT';

        return {
            content: [
                {
                    type: "text",
                    text: `${statusEmoji} Status: ${statusText}\nEmployee: ${employeeId}\nStatus: ${status}\nOn Time: ${todayRecord.onTime ? 'Yes' : 'No'}\n\nDetails:\n${JSON.stringify(todayRecord, null, 2)}`,
                },
            ],
        };
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Attendance MCP server running on stdio");
    }
}

const server = new AttendanceMCPServer();
server.run().catch(console.error);
