"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Bell, Droplet, Phone, AlertTriangle, BarChart3, History, Sun } from "lucide-react"
// import { WaterQualityGauge } from "@/components/water-quality-gauge"
import { WaterQualityChart } from "@/components/water-quality-chart"
import { getWaterQualityData } from "@/lib/mock-data"
import { WaterPollutionAnimation } from "@/components/water-pollution-animation"
import { WaterQualityTrends } from "@/components/water-quality-trends"
import { NotificationSignup } from "@/components/notification-signup"
import { fetchWaterQualityData } from "@/lib/api-services"
import { NavigationBar } from "@/components/navigation-bar"
import { useToast } from "@/components/ui/use-toast"
// import { WaterQualityGauge } from "@/components/water-quality-gauge"

export default function WaterQualityPage() {
  const [alertOpen, setAlertOpen] = useState(false)
  const [waterData, setWaterData] = useState(getWaterQualityData())
  const [alertSound, setAlertSound] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("current")
  const [showNotificationForm, setShowNotificationForm] = useState(false)
  const [externalData, setExternalData] = useState<any>(null)
  const [arduinoData, setArduinoData] = useState<any>(null)
  const [arduinoLoading, setArduinoLoading] = useState(true)
  const [arduinoError, setArduinoError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCallDialog, setShowCallDialog] = useState(false)

  // Add this function inside the component before the return statement
  const { toast } = useToast()

  const handleReportIssue = () => {
    setShowCallDialog(true)
  }
  
  const handleMakeReportCall = () => {
    try {
      window.location.href = "tel:1916" // Different number for reporting issues
      toast({
        title: "Calling Water Quality Helpline",
        description: "Connecting to 1916...",
      })
    } catch (error) {
      console.error("Error making call:", error)
      toast({
        title: "Call Failed",
        description: "Unable to initiate call. Please dial 1916 manually.",
        variant: "destructive",
      })
    }
    setShowCallDialog(false)
  }

  const handleCallMCD = () => {
    setShowCallDialog(true)
  }

  const handleMakeCall = () => {
    try {
      window.location.href = "tel:155305"
      toast({
        title: "Calling Pollution Control Board",
        description: "Connecting to 155305...",
      })
    } catch (error) {
      console.error("Error making call:", error)
      toast({
        title: "Call Failed",
        description: "Unable to initiate call. Please dial 155305 manually.",
        variant: "destructive",
      })
    }
    setShowCallDialog(false)
  }

  // Initialize audio with proper error handling
  useEffect(() => {
    if (typeof Audio !== "undefined") {
      // Create a simple beep sound programmatically instead of loading a file
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // This function will be used to play a beep sound when needed
      const playBeep = () => {
        try {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)

          oscillator.type = "sine"
          oscillator.frequency.value = 800
          gainNode.gain.value = 0.5

          oscillator.start()

          // Stop after 500ms
          setTimeout(() => {
            oscillator.stop()
          }, 500)
        } catch (e) {
          console.error("Error playing beep:", e)
        }
      }

      // Store the function in state
      setAlertSound({ play: playBeep } as any)
    }
  }, [])

  // Fetch external water quality data
  useEffect(() => {
    const getExternalData = async () => {
      try {
        setIsLoading(true)

        // Default coordinates for Delhi
        let latitude = 28.6139
        let longitude = 77.209

        // Try to get user location, but don't wait for it if it fails
        try {
          if (navigator.geolocation) {
            // Create a promise that will resolve with the position or reject after a timeout
            const getPositionPromise = new Promise<GeolocationPosition>((resolve, reject) => {
              const timeoutId = setTimeout(() => {
                reject(new Error("Geolocation request timed out"))
              }, 3000)

              navigator.geolocation.getCurrentPosition(
                (position) => {
                  clearTimeout(timeoutId)
                  resolve(position)
                },
                (error) => {
                  clearTimeout(timeoutId)
                  reject(error)
                },
                { maximumAge: 60000, timeout: 3000, enableHighAccuracy: false },
              )
            })

            // Try to get position, but don't let it block the rest of the function
            const position = await getPositionPromise
            latitude = position.coords.latitude
            longitude = position.coords.longitude
            console.log("Using user location:", latitude, longitude)
          }
        } catch (error) {
          console.log("Using default location due to:", error instanceof Error ? error.message : "Unknown error")
          // Continue with default coordinates
        }

        // Fetch data with either user coordinates or defaults
        const data = await fetchWaterQualityData(latitude, longitude)

        // Ensure location is a string
        if (typeof data.location === "object" && data.location !== null && "name" in data.location) {
          data.location = data.location.name
        } else if (typeof data.location !== "string") {
          data.location = "Delhi Municipal Supply"
        }

        setExternalData(data)
      } catch (error) {
        console.error("Error fetching external water quality data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getExternalData()

    // Refresh data every 5 minutes
    const interval = setInterval(getExternalData, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const getArduinoData = async () => {
      try {
        setArduinoLoading(true)
        setArduinoError(null)

        const response = await fetch("/api/arduino")
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to read Arduino data")
        }

        setArduinoData(result.data)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        console.error("Arduino fetch error:", error)
        setArduinoError(message)
        setArduinoData(null)
      } finally {
        setArduinoLoading(false)
      }
    }

    getArduinoData()
    const interval = setInterval(getArduinoData, 10000)
    return () => clearInterval(interval)
  }, [])

  // Check for water quality issues
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = getWaterQualityData()
      setWaterData(newData)

      // Check if any parameter exceeds safe limits
      const hasIssue = newData.some((param) => param.value > param.safeLimit)

      if (hasIssue && !alertOpen) {
        setAlertOpen(true)
        if (alertSound) {
          try {
            alertSound.play()
          } catch (e) {
            console.error("Error playing sound:", e)
          }
        }

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          setAlertOpen(false)
        }, 3000)
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [alertOpen, alertSound])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-blue-900 via-blue-700 to-blue-500">
      <WaterPollutionAnimation />
      <NavigationBar />

      <div className="container relative mx-auto py-6 pt-20 space-y-6 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-white">Water Quality Monitor</h1>
{/* 
          <Button onClick={() => setShowNotificationForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Bell className="h-4 w-4 mr-2" />
            Get Notifications
          </Button> */}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 text-white">
            <TabsTrigger value="current" className="data-[state=active]:bg-white/20">
              <Droplet className="h-4 w-4 mr-2" />
              Current Data
            </TabsTrigger>
            {/* <TabsTrigger value="charts" className="data-[state=active]:bg-white/20">
              <BarChart3 className="h-4 w-4 mr-2" />
              Charts
            </TabsTrigger> */}
            <TabsTrigger value="trends" className="data-[state=active]:bg-white/20">
              <History className="h-4 w-4 mr-2" />
              Historical Trends
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "current" && (
          <div className="grid gap-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Arduino Sensor Data</CardTitle>
                <CardDescription className="text-white/70">
                  Live probe values from the connected water quality device.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {arduinoLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : arduinoError ? (
                  <div className="p-4 text-center text-white/70">{arduinoError}</div>
                ) : arduinoData ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-slate-950/40 p-4">
                      <div className="text-sm font-medium text-white">pH</div>
                      <div className="mt-2 text-3xl font-bold text-cyan-300">{arduinoData.ph}</div>
                    </div>
                    <div className="rounded-lg bg-slate-950/40 p-4">
                      <div className="text-sm font-medium text-white">Temperature</div>
                      <div className="mt-2 text-3xl font-bold text-amber-300">{arduinoData.temp}°C</div>
                    </div>
                    <div className="rounded-lg bg-slate-950/40 p-4">
                      <div className="text-sm font-medium text-white">TDS</div>
                      <div className="mt-2 text-3xl font-bold text-yellow-300">{arduinoData.tds} mg/L</div>
                    </div>
                    <div className="rounded-lg bg-slate-950/40 p-4">
                      <div className="text-sm font-medium text-white">Turbidity</div>
                      <div className="mt-2 text-3xl font-bold text-teal-300">{arduinoData.ntu} NTU</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-white/70">Waiting for Arduino sensor data...</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* {activeTab === "charts" && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Water Quality Parameters</CardTitle>
              <CardDescription className="text-white/70">Detailed analysis of water quality metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ph">
                <TabsList className="grid w-full grid-cols-4 bg-white/10 text-white">
                  <TabsTrigger value="ph" className="data-[state=active]:bg-white/20">
                    pH
                  </TabsTrigger>
                  <TabsTrigger value="tds" className="data-[state=active]:bg-white/20">
                    TDS
                  </TabsTrigger>
                  <TabsTrigger value="hardness" className="data-[state=active]:bg-white/20">
                    Hardness
                  </TabsTrigger>
                  <TabsTrigger value="chlorine" className="data-[state=active]:bg-white/20">
                    Chlorine
                  </TabsTrigger>
                </TabsList>

                <WaterQualityChart expanded={true} />
              </Tabs>
            </CardContent>
          </Card>
        )} */}

        {activeTab === "trends" && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Historical Water Quality Trends</CardTitle>
              <CardDescription className="text-white/70">Monthly and seasonal water quality patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <WaterQualityTrends />
            </CardContent>
          </Card>
        )}

        {/* External Data Section */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">External Water Quality Data</CardTitle>
            <CardDescription className="text-white/70">Data extracted from external monitoring sources</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : externalData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplet className="h-5 w-5 text-blue-400" />
                    <span className="text-lg font-medium text-white">{externalData.location}</span>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      externalData.overall_safety === "Safe"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {externalData.overall_safety}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(externalData.parameters).map(([key, data]: [string, any]) => (
                    <div key={key} className="p-3 rounded-md bg-white/10">
                      <div className="text-sm font-medium text-white mb-1">{key.toUpperCase()}</div>
                      <div className="flex items-end gap-1">
                        <span className="text-xl font-bold text-white">{data.value}</span>
                        <span className="text-sm text-white/70">{data.unit}</span>
                      </div>
                      <div className={`text-xs mt-1 ${data.is_safe ? "text-green-400" : "text-red-400"}`}>
                        {data.is_safe ? "Within safe limits" : "Exceeds safe limits"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-white/60 flex justify-between">
                  <span>Last updated: {new Date(externalData.timestamp).toLocaleString()}</span>
                  <span>Source: Delhi Water Quality Monitoring Network</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-white/70">Failed to load external data. Please try again later.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Water Safety Information</CardTitle>
            <CardDescription className="text-white/70">
              Understanding water quality parameters and health impacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-cyan-400/50 p-3 bg-cyan-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="h-4 w-4 text-cyan-300" />
                  <h3 className="text-sm font-medium text-white">pH Level</h3>
                </div>
                <p className="text-xs text-white/70">
                  <span className="text-cyan-300 font-bold">Safe range: 6.5-8.5.</span> Affects taste and pipe
                  corrosion. Extreme values can cause digestive issues.
                </p>
              </div>

              <div className="rounded-lg border border-yellow-400/50 p-3 bg-yellow-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="h-4 w-4 text-yellow-300" />
                  <h3 className="text-sm font-medium text-white">Total Dissolved Solids</h3>
                </div>
                <p className="text-xs text-white/70">
                  <span className="text-yellow-300 font-bold">Safe limit: &lt;500 mg/L.</span> High levels affect taste
                  and can indicate contamination.
                </p>
              </div>

              <div className="rounded-lg border border-green-400/50 p-3 bg-green-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="h-4 w-4 text-green-300" />
                  <h3 className="text-sm font-medium text-white">Water Hardness</h3>
                </div>
                <p className="text-xs text-white/70">
                  <span className="text-green-300 font-bold">Safe limit: &lt;300 mg/L CaCO₃.</span> Hard water can cause
                  scale buildup but isn't typically a health concern.
                </p>
              </div>

              <div className="rounded-lg border border-orange-400/50 p-3 bg-orange-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="h-4 w-4 text-orange-300" />
                  <h3 className="text-sm font-medium text-white">UV Index</h3>
                </div>
                <p className="text-xs text-white/70">
                  <span className="text-orange-300 font-bold">Safe level: &lt;3.</span> Measures ultraviolet radiation
                  levels. High UV can damage skin and eyes.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Button
                variant="outline"
                className="w-full bg-cyan-500/20 text-white border-cyan-400/50 hover:bg-cyan-500/30"
                onClick={() => handleCallMCD()}
              >
                <Phone className="mr-2 h-4 w-4" />
                Contact Pollution Control Board
              </Button>
              <Button
                variant="outline"
                className="w-full bg-yellow-500/20 text-white border-yellow-400/50 hover:bg-yellow-500/30"
                onClick={() => handleCallMCD()}
              >
                Report Water Quality Issue
              </Button>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
          <AlertDialogContent className="bg-black/80 border-red-500/50 backdrop-blur-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Water Quality Alert
              </AlertDialogTitle>
              <div className="text-white/80">
                <AlertDialogDescription>
                  Abnormal water quality detected in your municipal water supply. The following parameters exceed safe
                  limits:
                </AlertDialogDescription>
                <ul className="mt-2 space-y-1">
                  {waterData
                    .filter((param) => param.value > param.safeLimit)
                    .map((param) => (
                      <li key={param.name} className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        {param.name}: {param.value} {param.unit} (Safe limit: {param.safeLimit} {param.unit})
                      </li>
                    ))}
                </ul>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Dismiss
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setAlertOpen(false)
                  handleCallMCD()
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Report to PCB
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showCallDialog} onOpenChange={setShowCallDialog}>
          <AlertDialogContent className="bg-black/80 border-blue-500/50 backdrop-blur-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Call Pollution Control Board</AlertDialogTitle>
              <AlertDialogDescription className="text-white/80">
                Would you like to call the Pollution Control Board at 155305 to report this issue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleMakeCall} className="bg-blue-600 hover:bg-blue-700">
                <Phone className="h-4 w-4 mr-2" />
                Call 155305
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {showNotificationForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <NotificationSignup onClose={() => setShowNotificationForm(false)} />
          </div>
        )}
      </div>
    </div>
  )
}

