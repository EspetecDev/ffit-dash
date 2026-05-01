#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

const server = new McpServer({
  name: "ffit-dash-intake",
  version: "0.1.0",
})

function getApiBaseUrl() {
  return (process.env.FFIT_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "")
}

function getIngestToken() {
  const token = process.env.FFIT_INGEST_TOKEN?.trim()
  if (!token) {
    throw new Error("FFIT_INGEST_TOKEN must be set to a user API token to upload intake entries")
  }

  return token
}

async function createIntakeEntry(input) {
  const endpoint = `${getApiBaseUrl()}/api/intake`
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${getIngestToken()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload.error || `API request failed with status ${response.status}`
    throw new Error(message)
  }

  if (!payload.entry) {
    throw new Error("API response did not include an intake entry")
  }

  return payload.entry
}

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
  .describe("Entry date in YYYY-MM-DD format")

const numericSchema = z
  .union([z.number(), z.string()])
  .optional()
  .describe("Numeric value. Strings are accepted and normalized by the API.")

const intakeEntrySchema = {
  date: dateSchema,
  meal: z.string().min(1).optional().describe("Meal name, for example Breakfast, Lunch, Dinner"),
  food: z.string().min(1).describe("Food or drink description"),
  quantity: z.string().optional().describe("Amount as text, for example 1, 250, or 1.5"),
  unit: z.string().optional().describe("Unit, for example plate, g, ml, cup, serving"),
  brand: z.string().optional().describe("Brand or restaurant name"),
  calories: numericSchema,
  fat: numericSchema,
  carbs: numericSchema,
  protein: numericSchema,
  url: z.string().url().optional().or(z.literal("")).describe("Optional source URL"),
  notes: z.string().optional().describe("Optional notes"),
}

server.registerTool(
  "upload_intake_entry",
  {
    title: "Upload Intake Entry",
    description: "Upload one food or drink intake entry through the Ffit Dash API.",
    inputSchema: intakeEntrySchema,
    annotations: {
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
      readOnlyHint: false,
      title: "Upload Intake Entry",
    },
  },
  async (input) => {
    const entry = await createIntakeEntry(input)

    return {
      content: [
        {
          type: "text",
          text: `Created intake entry ${entry.id} through ${getApiBaseUrl()}/api/intake.`,
        },
      ],
      structuredContent: {
        entry,
        source: `${getApiBaseUrl()}/api/intake`,
      },
    }
  }
)

server.registerTool(
  "upload_intake_entries",
  {
    title: "Upload Intake Entries",
    description: "Upload multiple food or drink intake entries through the Ffit Dash API.",
    inputSchema: {
      entries: z.array(z.object(intakeEntrySchema)).min(1).max(100),
    },
    annotations: {
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
      readOnlyHint: false,
      title: "Upload Intake Entries",
    },
  },
  async ({ entries }) => {
    const created = []
    for (const entry of entries) {
      created.push(await createIntakeEntry(entry))
    }

    return {
      content: [
        {
          type: "text",
          text: `Created ${created.length} intake entries through ${getApiBaseUrl()}/api/intake.`,
        },
      ],
      structuredContent: {
        entries: created,
        source: `${getApiBaseUrl()}/api/intake`,
      },
    }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  console.error("MCP server error:", error)
  process.exit(1)
})
