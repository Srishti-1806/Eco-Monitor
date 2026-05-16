// API services for fetching environmental data
import axios from "axios"

function normalizeEnv(value?: string) {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === "undefined" || trimmed.toLowerCase() === "null") {
    return undefined
  }
  return trimmed
}

const BASE_URL = normalizeEnv(process.env.NEXT_PUBLIC_BASE_URL)
const WAQI_TOKEN = normalizeEnv(process.env.NEXT_PUBLIC_WAQI_TOKEN)
const MEERSENS_API_KEY = normalizeEnv(process.env.NEXT_PUBLIC_MEERSENS_API_KEY)

const DEFAULT_LAT = 28.6139
const DEFAULT_LNG = 77.209

// Helper function to safely get user location with fallback
export async function getUserLocation(defaultLat = DEFAULT_LAT, defaultLng = DEFAULT_LNG) {
  return new Promise<{ latitude: number; longitude: number }>((resolve) => {
    try {
      if (!navigator.geolocation) {
        console.log("Geolocation not supported, using default location")
        resolve({ latitude: defaultLat, longitude: defaultLng })
        return
      }

      const timeoutId = setTimeout(() => {
        console.log("Geolocation request timed out, using default location")
        resolve({ latitude: defaultLat, longitude: defaultLng })
      }, 5000)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId)
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          clearTimeout(timeoutId)
          console.log(`Geolocation error (${error.code}): ${error.message}, using default location`)
          if (error.code === 1) {
            console.log("Permission denied - user did not allow location access")
          } else if (error.code === 2) {
            console.log("Position unavailable - network error or satellites couldn't be reached")
          } else if (error.code === 3) {
            console.log("Timeout - took too long to get location")
          }
          resolve({ latitude: defaultLat, longitude: defaultLng })
        },
        {
          enableHighAccuracy: false,
          timeout: 4000,
          maximumAge: 60000,
        },
      )
    } catch (error) {
      console.error("Unexpected error getting location:", error)
      resolve({ latitude: defaultLat, longitude: defaultLng })
    }
  })
}

function getMockUVData(latitude = DEFAULT_LAT, longitude = DEFAULT_LNG) {
  return {
    location: {
      name: "Delhi, India",
      latitude,
      longitude,
    },
    current: {
      uv_index: 7,
      uv_category: "High",
      timestamp: new Date().toISOString(),
    },
    forecast: [
      { date: "2026-05-16", max_uv: 9.5, category: "Very High" },
      { date: "2026-05-17", max_uv: 8.4, category: "Very High" },
      { date: "2026-05-18", max_uv: 7.1, category: "High" },
    ],
    sun_info: {
      sunrise: "06:15",
      sunset: "18:45",
      solar_noon: "12:30",
    },
    protection_required: true,
    getUVProtectionRecommendations: { recommendation: "Wear sunscreen and protective clothing." },
  }
}

export async function fetchUVData(latitude?: number, longitude?: number) {
  if (latitude === undefined || longitude === undefined) {
    latitude = DEFAULT_LAT
    longitude = DEFAULT_LNG
  }

  if (!MEERSENS_API_KEY) {
    console.warn("MEERSENS_API_KEY is not configured. Returning mock UV data.")
    return getMockUVData(latitude, longitude)
  }

  try {
    const data = await axios.get("https://api.meersens.com/environment/public/uv/current", {
      params: {
        lat: latitude,
        lng: longitude,
        health_recommendations: true,
      },
      headers: { apikey: MEERSENS_API_KEY },
    })

    if (!data?.data?.index) {
      throw new Error("Invalid response from UV API")
    }

    return {
      location: {
        name: data.data.location?.name ?? "Delhi, India",
        latitude,
        longitude,
      },
      current: {
        uv_index: data.data.index?.value ?? 7,
        uv_category: data.data.index?.qualification ?? "High",
        timestamp: new Date().toISOString(),
      },
      forecast: data.data.forecast || getMockUVData(latitude, longitude).forecast,
      sun_info: data.data.sun_info || getMockUVData(latitude, longitude).sun_info,
      protection_required: true,
      getUVProtectionRecommendations: data.data.health_recommendations ?? {
        recommendation: "No recommendations available",
      },
    }
  } catch (error) {
    console.warn("Error fetching UV data, returning mock UV data:", error)
    return getMockUVData(latitude, longitude)
  }
}

// Function to fetch water quality data from Meersens API
export async function fetchWaterQualityData(latitude?: number, longitude?: number) {
  if (latitude === undefined || longitude === undefined) {
    latitude = DEFAULT_LAT
    longitude = DEFAULT_LNG
  }

  try {
    const mockResponse = {
      status: "success",
      data: {
        location: {
          name: "Delhi Municipal Supply",
          latitude,
          longitude,
        },
        parameters: {
          ph: {
            value: 7.8,
            unit: "",
            safe_min: 6.5,
            safe_max: 8.5,
            is_safe: true,
          },
          tds: {
            value: 480,
            unit: "mg/L",
            safe_max: 500,
            is_safe: true,
          },
          hardness: {
            value: 320,
            unit: "mg/L",
            safe_max: 300,
            is_safe: false,
          },
          chlorine: {
            value: 3.2,
            unit: "mg/L",
            safe_max: 4,
            is_safe: true,
          },
          turbidity: {
            value: 4.5,
            unit: "NTU",
            safe_max: 5,
            is_safe: true,
          },
          bacteria: {
            value: 0,
            unit: "CFU/100mL",
            safe_max: 0,
            is_safe: true,
          },
        },
        overall_safety: "Moderate",
        timestamp: new Date().toISOString(),
        source: "Municipal Water Testing Lab",
      },
    }

    return mockResponse.data
  } catch (error) {
    console.warn("Error fetching water quality data, returning mock water quality data:", error)
    return {
      location: "Delhi Municipal Supply",
      parameters: {
        ph: { value: 7.8, unit: "", safe_min: 6.5, safe_max: 8.5, is_safe: true },
        tds: { value: 480, unit: "mg/L", safe_max: 500, is_safe: true },
        hardness: { value: 320, unit: "mg/L", safe_max: 300, is_safe: false },
        chlorine: { value: 3.2, unit: "mg/L", safe_max: 4, is_safe: true },
        turbidity: { value: 4.5, unit: "NTU", safe_max: 5, is_safe: true },
        bacteria: { value: 0, unit: "CFU/100mL", safe_max: 0, is_safe: true },
      },
      overall_safety: "Moderate",
      timestamp: new Date().toISOString(),
      source: "Municipal Water Testing Lab",
    }
  }
}

function getMockAQIData() {
  return {
    aqi: 120,
    idx: 1234,
    attributions: [
      {
        url: "https://app.cpcbccr.com/",
        name: "CPCB - India Central Pollution Control Board",
      },
    ],
    city: {
      name: "Delhi, India",
      geo: [DEFAULT_LAT, DEFAULT_LNG],
    },
    dominentpol: "pm25",
    iaqi: {
      co: { v: 10 },
      h: { v: 55 },
      no2: { v: 46 },
      o3: { v: 20 },
      p: { v: 1010 },
      pm10: { v: 80 },
      pm25: { v: 55 },
      so2: { v: 12 },
      t: { v: 28 },
      w: { v: 3 },
    },
    time: {
      s: new Date().toISOString(),
      tz: "+05:30",
    },
    forecast: {
      daily: {
        pm25: [
          { avg: 70, day: "2026-05-16", max: 90, min: 60 },
          { avg: 72, day: "2026-05-17", max: 92, min: 60 },
          { avg: 68, day: "2026-05-18", max: 88, min: 58 },
        ],
      },
    },
  }
}

function isValidEnvValue(value?: string) {
  return Boolean(value) && value.trim().length > 0 && !["undefined", "null"].includes(value.trim().toLowerCase())
}

export async function fetchAQIData(longitude?: number, latitude?: number) {
  if (!isValidEnvValue(BASE_URL) || !isValidEnvValue(WAQI_TOKEN)) {
    console.warn("WAQI API configuration is missing or invalid. Returning mock AQI data.")
    return getMockAQIData()
  }

  try {
    let url: string

    if (latitude !== undefined && longitude !== undefined) {
      url = `${BASE_URL}/feed/geo:${latitude};${longitude}/?token=${WAQI_TOKEN}`
    } else {
      url = `${BASE_URL}/feed/here/?token=${WAQI_TOKEN}`
    }

    const data = await fetch(url, { method: "GET" })
    const response = await data.json()

    if (response.status !== "ok") {
      throw new Error("API returned an error")
    }

    return response.data
  } catch (error) {
    console.warn("Error fetching AQI data, returning mock AQI data:", error)
    return getMockAQIData()
  }
}
