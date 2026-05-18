import { NextResponse } from "next/server"

const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID?.trim()
const THINGSPEAK_READ_KEY = process.env.THINGSPEAK_READ_KEY?.trim()

const THINGSPEAK_FIELD_PH = process.env.THINGSPEAK_FIELD_PH?.trim() || "field2"
const THINGSPEAK_FIELD_TEMP = process.env.THINGSPEAK_FIELD_TEMP?.trim() || "field1"
const THINGSPEAK_FIELD_TDS = process.env.THINGSPEAK_FIELD_TDS?.trim() || "field3"
const THINGSPEAK_FIELD_NTU = process.env.THINGSPEAK_FIELD_NTU?.trim() || "field4"
const THINGSPEAK_FIELD_ORP = process.env.THINGSPEAK_FIELD_ORP?.trim() || "field5"
const THINGSPEAK_FIELD_DO = process.env.THINGSPEAK_FIELD_DO?.trim() || "field6"
const THINGSPEAK_FIELD_EC = process.env.THINGSPEAK_FIELD_EC?.trim() || "field7"
const THINGSPEAK_FIELD_OTHER = process.env.THINGSPEAK_FIELD_OTHER?.trim() || "field8"

const FIELD_MAP: Record<string, string> = {
  [THINGSPEAK_FIELD_PH]: "ph",
  [THINGSPEAK_FIELD_TEMP]: "temp",
  [THINGSPEAK_FIELD_TDS]: "tds",
  [THINGSPEAK_FIELD_NTU]: "ntu",
  [THINGSPEAK_FIELD_ORP]: "orp",
  [THINGSPEAK_FIELD_DO]: "do",
  [THINGSPEAK_FIELD_EC]: "ec",
  [THINGSPEAK_FIELD_OTHER]: "other",
}

const FIELD_UNITS: Record<string, string> = {
  ph: "",
  temp: "°C",
  tds: "mg/L",
  ntu: "NTU",
  orp: "mV",
  do: "mg/L",
  ec: "μS/cm",
  other: "",
}

const FIELD_LABELS: Record<string, string> = {
  ph: "pH",
  temp: "Temperature",
  tds: "TDS",
  ntu: "Turbidity",
  orp: "ORP",
  do: "Dissolved Oxygen",
  ec: "Electrical Conductivity",
  other: "Other",
}

function parseFieldValue(value: unknown) {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = parseFloat(value)
    return Number.isFinite(parsed) ? parsed : value
  }
  return value
}

export async function GET() {
  if (!THINGSPEAK_CHANNEL_ID || !THINGSPEAK_READ_KEY) {
    return NextResponse.json(
      {
        success: false,
        message:
          "ThingSpeak channel ID or read key is not configured. Set THINGSPEAK_CHANNEL_ID and THINGSPEAK_READ_KEY in environment variables.",
      },
      { status: 500 },
    )
  }

  const url = `https://api.thingspeak.com/channels/${encodeURIComponent(
    THINGSPEAK_CHANNEL_ID,
  )}/feeds/last.json?api_key=${encodeURIComponent(THINGSPEAK_READ_KEY)}`

  try {
    const response = await fetch(url, { cache: "no-store" })
    if (!response.ok) {
      throw new Error(`ThingSpeak API returned ${response.status}`)
    }

    const payload = await response.json()
    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid ThingSpeak response")
    }

    const fields: Record<string, any> = {}
    Object.entries(FIELD_MAP).forEach(([fieldName, key]) => {
      if (payload[fieldName] !== undefined && payload[fieldName] !== null && payload[fieldName] !== "") {
        fields[key] = {
          label: FIELD_LABELS[key] ?? key,
          value: parseFieldValue(payload[fieldName]),
          unit: FIELD_UNITS[key] ?? "",
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        channel: {
          id: THINGSPEAK_CHANNEL_ID,
          name: payload.channel_name || "ThingSpeak Water Monitor",
        },
        entry_id: payload.entry_id,
        created_at: payload.created_at,
        fields,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("ThingSpeak proxy error:", error)
    const message = error instanceof Error ? error.message : "Unable to fetch ThingSpeak data"
    return NextResponse.json({ success: false, message }, { status: 502 })
  }
}
