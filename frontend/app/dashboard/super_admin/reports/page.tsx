"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator, SelectLabel, SelectGroup } from "@/components/ui/select"
// import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Download, Printer } from "lucide-react"
import { addDays } from "date-fns"
import { DateRange } from "react-day-picker"
import { reportsApi, type Library, type ReportsFilters, type RevenueData, type UserActivityData, type TopLibrary } from "@/lib/reports-api"
import toast from "react-hot-toast"

// Define types for better type safety
interface ActivityData {
  activeUsers: number;
  newUsers: number;
  bookings: number;
}

interface LibraryData {
  id: string;
  name: string;
  city: string;
  state?: string;
  members: number;
  revenue: number;
  bookings: number;
  occupancyRate: number;
}

interface RevenueBreakdown {
  membership?: number;
  seatBooking?: number;
  penalty?: number;
  eBookPurchase?: number;
  other?: number;
}

interface Summary {
  totalUsers?: number;
  totalActiveToday?: number;
  totalNewThisMonth?: number;
  monthlyRevenue?: number;
  monthlyBookings?: number;
  activeUsers?: number;
  newUsers?: number;
}

// Helper function to generate random numbers
const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

// Helper function to generate monthly revenue data
const generateMonthlyRevenueData = () => {
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  return months.map((month, i) => {
    const baseRevenue = randomNumber(60000, 90000);
    const variability = Math.sin(i * 0.8) * 20000;
    
    return {
      month,
      revenue: Math.max(10000, Math.round(baseRevenue + variability))
    }
  });
}

// Helper function to generate mock libraries
const generateMockLibraries = () => {
  const libraryNames = ['Central Library', 'Eastside Library', 'Westside Library', 'Downtown Library', 'University Library']
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune']
  
  return libraryNames.map((name, i) => ({
    id: `lib-${i}`,
    name,
    city: cities[i % cities.length],
    members: randomNumber(500, 2000),
    bookings: randomNumber(100, 500),
    rating: (randomNumber(35, 50) / 10).toFixed(1),
    revenue: randomNumber(50000, 150000),
    occupancyRate: randomNumber(60, 95)
  }))
}

// Helper function to generate mock daily activity
const generateMockDailyActivity = () => {
  const days = []
  for (let i = 30; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push({
      date: date.toISOString(),
      activeUsers: randomNumber(100, 500),
      newUsers: randomNumber(10, 50),
      bookings: randomNumber(50, 200)
    })
  }
  return days
}

// Helper function to generate mock library performance
const generateMockLibraryPerformance = () => {
  return generateMockLibraries().map(lib => ({
    ...lib,
    state: 'Maharashtra'
  }))
}

// Enhanced helper function to create mock data when API fails
const enhanceWithRandomData = (data: unknown): Record<string, unknown> => {
  if (!data) {
    return {
      summary: {
        monthlyRevenue: randomNumber(50000, 200000),
        monthlyBookings: randomNumber(1000, 5000),
        activeUsers: randomNumber(5000, 20000),
        newUsers: randomNumber(500, 2000),
        totalUsers: randomNumber(10000, 50000),
        totalActiveToday: randomNumber(1000, 5000),
        totalNewThisMonth: randomNumber(500, 2000),
        totalLibraries: randomNumber(10, 50)
      },
      monthlyRevenue: generateMonthlyRevenueData(),
      topLibraries: generateMockLibraries(),
      revenueBreakdown: {
        membership: randomNumber(30000, 80000),
        seatBooking: randomNumber(20000, 60000),
        penalty: randomNumber(1000, 5000),
        eBookPurchase: randomNumber(5000, 15000),
        other: randomNumber(2000, 10000)
      },
      totalRevenue: randomNumber(100000, 300000),
      dailyActivity: generateMockDailyActivity(),
      libraryPerformance: generateMockLibraryPerformance(),
      period: {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString()
      }
    }
  }
  
  const enhancedData = JSON.parse(JSON.stringify(data)) as Record<string, unknown>
  
  if (!enhancedData.monthlyRevenue || (Array.isArray(enhancedData.monthlyRevenue) && enhancedData.monthlyRevenue.length === 0)) {
    enhancedData.monthlyRevenue = generateMonthlyRevenueData()
  }
  
  if (!enhancedData.topLibraries || (Array.isArray(enhancedData.topLibraries) && enhancedData.topLibraries.length === 0)) {
    enhancedData.topLibraries = generateMockLibraries()
  }
  
  if (!enhancedData.dailyActivity || (Array.isArray(enhancedData.dailyActivity) && enhancedData.dailyActivity.length === 0)) {
    enhancedData.dailyActivity = generateMockDailyActivity()
  }
  
  if (!enhancedData.libraryPerformance || (Array.isArray(enhancedData.libraryPerformance) && enhancedData.libraryPerformance.length === 0)) {
    enhancedData.libraryPerformance = generateMockLibraryPerformance()
  }
  
  const replaceZeros = (obj: Record<string, unknown>) => {
    if (!obj || typeof obj !== 'object') return
    
    Object.keys(obj).forEach(key => {
      if (obj[key] === 0) {
        if (key.includes('Revenue') || key.includes('revenue')) {
          obj[key] = randomNumber(10000, 200000)
        } else if (key.includes('Booking') || key.includes('booking')) {
          obj[key] = randomNumber(100, 2000)
        } else if (key.includes('User') || key.includes('user') || key.includes('member')) {
          obj[key] = randomNumber(500, 5000)
        } else {
          obj[key] = randomNumber(50, 1000)
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        replaceZeros(obj[key] as Record<string, unknown>)
      }
    })
  }
  
  replaceZeros(enhancedData)
  return enhancedData
}

export default function ReportsPage() {  const [date] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [libraryFilter, setLibraryFilter] = useState<string>("all")
  const [libraries, setLibraries] = useState<Library[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revenueData, setRevenueData] = useState<Record<string, unknown> | null>(null)
  const [userActivityData, setUserActivityData] = useState<Record<string, unknown> | null>(null)
  const [libraryPerformanceData, setLibraryPerformanceData] = useState<Record<string, unknown> | null>(null)
  const [overviewData, setOverviewData] = useState<Record<string, unknown> | null>(null)

  // Fetch libraries for dropdown
  useEffect(() => {
    const fetchLibraries = async () => {
      try {
        const response = await reportsApi.getLibrariesList()
        if (response.success) {
          setLibraries(response.data.libraries)
        }
      } catch (err) {
        console.error('Failed to fetch libraries:', err)
        setError('Failed to load libraries')
      }
    }
    fetchLibraries()
  }, [])
  // Fetch data based on filters
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const filters: ReportsFilters = {
          startDate: date.from?.toISOString(),
          endDate: date.to?.toISOString(),
          libraryId: libraryFilter !== "all" ? libraryFilter : undefined
        }

        console.log('Fetching reports with filters:', filters)

        const [overview, revenue, userActivity, libraryPerformance] = await Promise.all([
          reportsApi.getReportsOverview({ libraryId: filters.libraryId }).catch(err => {
            console.error('Overview API failed:', err)
            return { data: null }
          }),
          reportsApi.getRevenueReports(filters).catch(err => {
            console.error('Revenue API failed:', err)
            toast.error('Failed to fetch revenue data')
            return { data: null }
          }),
          reportsApi.getUserActivityReports(filters).catch(err => {
            console.error('User Activity API failed:', err)
            return { data: null }
          }),
          reportsApi.getLibraryPerformanceReports(filters).catch(err => {
            console.error('Library Performance API failed:', err)
            return { data: null }
          })
        ])

        console.log('API responses:', { overview, revenue, userActivity, libraryPerformance })
        
        // Enhance data with random values for testing
        setOverviewData(enhanceWithRandomData(overview.data))
        setRevenueData(enhanceWithRandomData(revenue.data))
        setUserActivityData(enhanceWithRandomData(userActivity.data))
        setLibraryPerformanceData(enhanceWithRandomData(libraryPerformance.data))

      } catch (err) {
        console.error('Failed to fetch reports data:', err)
        setError(`Failed to load reports data: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()  }, [date, libraryFilter])

  if (loading) {
    return (
      <div className="space-y-6 min-w-[70vw]">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading reports...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 min-w-[70vw]">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">{error}</div>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }  // Add a function to filter data based on selected library
  const getFilteredData = (data: Record<string, unknown> | null, libraryId: string): Record<string, unknown> | null => {
    if (!data || libraryId === "all") return data;
    
    // Filter the data to show only selected library's data
    const filteredData = { ...data };
    
    // Filter top libraries to show only selected library
    if (filteredData.topLibraries && Array.isArray(filteredData.topLibraries)) {
      filteredData.topLibraries = filteredData.topLibraries.filter(
        (lib: unknown) => (lib as { id: string }).id === libraryId
      );
    }
    
    // Filter library performance data
    if (filteredData.libraryPerformance && Array.isArray(filteredData.libraryPerformance)) {
      filteredData.libraryPerformance = filteredData.libraryPerformance.filter(
        (lib: unknown) => (lib as { id: string }).id === libraryId
      );
    }
    
    return filteredData;
  };

  // Update the data display to use filtered data
  const filteredOverviewData = getFilteredData(overviewData, libraryFilter);
  const filteredLibraryPerformanceData = getFilteredData(libraryPerformanceData, libraryFilter);

  return (
    <div className="space-y-6 min-w-[70vw] pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">View and generate platform reports</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {/* <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue Report</SelectItem>
              <SelectItem value="users">User Activity</SelectItem>
              <SelectItem value="libraries">Library Performance</SelectItem>
              <SelectItem value="bookings">Booking Analytics</SelectItem>
            </SelectContent>
          </Select> */}

          <Select value={libraryFilter} onValueChange={setLibraryFilter}>
            <SelectTrigger className="w-[180px] bg-white opacity-60 border-none">
              <SelectValue placeholder="Filter by library" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Libraries</SelectItem>
              <SelectSeparator />
              <SelectGroup><SelectLabel>Available Libraries</SelectLabel></SelectGroup>
              {libraries.map((library) => (
                <SelectItem key={library.id} value={library.id}> 
                  {library.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* <DatePickerWithRange date={date} setDate={setDate} /> */}
        </div>

        <div className="flex gap-2">
          <Button  className="bg-white opacity-60 text-black">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" className="bg-black text-white">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="libraries">Libraries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          {filteredOverviewData && (
            <>
              {/* Show library-specific header when a library is selected */}
              {libraryFilter !== "all" && (
                <Card >
                  <CardHeader>
                    <CardTitle>
                      {libraries.find(lib => lib.id === libraryFilter)?.name || "Selected Library"} - Overview
                    </CardTitle>
                    <CardDescription>
                      Performance metrics for selected library
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <Card className="bg-black text-white">
                  <CardHeader>
                    <CardTitle>Monthly Revenue</CardTitle>
                  </CardHeader>                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₹{(filteredOverviewData?.summary as { monthlyRevenue?: number })?.monthlyRevenue?.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black text-white">
                  <CardHeader>
                    <CardTitle>Monthly Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(filteredOverviewData?.summary as { monthlyBookings?: number })?.monthlyBookings?.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black text-white">
                  <CardHeader>
                    <CardTitle>Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(filteredOverviewData?.summary as { activeUsers?: number })?.activeUsers?.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black text-white">
                  <CardHeader>
                    <CardTitle>New Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(filteredOverviewData?.summary as { newUsers?: number })?.newUsers?.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Keep the charts using filteredOverviewData */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="bg-white border-0 rounded-md">
                  <CardHeader>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>
                      {libraryFilter === "all" 
                        ? "Member and library growth over time" 
                        : `Revenue trends for ${libraries.find(lib => lib.id === libraryFilter)?.name}`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>                    <div className="h-[300px] w-full">
                      <div className="flex h-full w-full items-end justify-between gap-2">
                        {(revenueData?.monthlyRevenue as RevenueData[])?.map((data: RevenueData, i: number) => {
                          const height = (data.revenue / Math.max(...((revenueData?.monthlyRevenue as RevenueData[])?.map((d: RevenueData) => d.revenue) ?? [1]))) * 100
                          return (
                            <div key={i} className="relative flex h-full flex-1 flex-col justify-end">
                              <div 
                                className="w-full rounded-md bg-primary" 
                                style={{ height: `${height}%` }}
                                title={`${data.month}: ₹${data.revenue}`}
                              ></div>
                              <span className="mt-2 text-center text-xs text-muted-foreground">{data.month}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border-0 rounded-md">
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>Monthly user growth for the past year</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-[300px] relative">
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-sm text-muted-foreground">
                        <div>100</div>
                        <div>80</div>
                        <div>60</div>
                        <div>40</div>
                        <div>20</div>
                      </div>
                      
                      {/* Chart area with grid lines */}
                      <div className="ml-12 h-full border-b border-l relative">
                        {/* Horizontal grid lines */}
                        <div className="absolute inset-0 grid grid-rows-4 w-full h-full">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="border-t border-muted/30 w-full"></div>
                          ))}
                        </div>
                        
                        {/* Vertical grid lines and X-axis labels */}
                        <div className="absolute inset-0 flex w-full h-full">
                          {['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].map((month, i) => (
                            <div key={i} className="flex-1 border-r border-muted/30 flex flex-col justify-between">
                              <div className="h-full"></div>
                              <div className="text-xs text-muted-foreground text-center mt-2">
                                {month}
                              </div>
                            </div>
                          ))}
                        </div>                        {/* User growth lines */}
                        <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                          {userActivityData?.dailyActivity && Array.isArray(userActivityData.dailyActivity) ? (
                            <>
                              <path
                                d={`M ${(userActivityData.dailyActivity as ActivityData[]).slice(-6).map((activity: ActivityData, i: number) => {
                                  const x = (i / Math.max(1, (userActivityData.dailyActivity as ActivityData[]).slice(-6).length - 1)) * 100;
                                  const maxUsers = Math.max(...(userActivityData.dailyActivity as ActivityData[]).slice(-6).map((d: ActivityData) => d.activeUsers));
                                  const y = 100 - (activity.activeUsers / Math.max(1, maxUsers) * 80 + 10);
                                  return `${x} ${y}`;
                                }).join(' L ')}`}
                                fill="none"
                                stroke="#8B4513"
                                strokeWidth="0.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                              />
                              
                              <path
                                d={`M ${(userActivityData.dailyActivity as ActivityData[]).slice(-6).map((activity: ActivityData, i: number) => {
                                  const x = (i / Math.max(1, (userActivityData.dailyActivity as ActivityData[]).slice(-6).length - 1)) * 100;
                                  const maxUsers = Math.max(...(userActivityData.dailyActivity as ActivityData[]).slice(-6).map((d: ActivityData) => d.newUsers));
                                  const y = 100 - (activity.newUsers / Math.max(1, maxUsers) * 80 + 10);
                                  return `${x} ${y}`;
                                }).join(' L ')}`}
                                fill="none"
                                stroke="#A0865E"
                                strokeWidth="0.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                              />
                              
                              <path
                                d={`M ${(userActivityData.dailyActivity as ActivityData[]).slice(-6).map((activity: ActivityData, i: number) => {
                                  const x = (i / Math.max(1, (userActivityData.dailyActivity as ActivityData[]).slice(-6).length - 1)) * 100;
                                  const maxBookings = Math.max(...(userActivityData.dailyActivity as ActivityData[]).slice(-6).map((d: ActivityData) => d.bookings));
                                  const y = 100 - (activity.bookings / Math.max(1, maxBookings) * 80 + 10);
                                  return `${x} ${y}`;
                                }).join(' L ')}`}
                                fill="none"
                                stroke="#654321"
                                strokeWidth="0.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                              />
                            </>
                          ) : null}
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="bg-white border-0 rounded-md">
                  <CardHeader>
                    <CardTitle>
                      {libraryFilter === "all" ? "Top Performing Libraries" : "Library Details"}
                    </CardTitle>
                    <CardDescription>
                      {libraryFilter === "all" 
                        ? "Libraries with highest ratings" 
                        : "Performance details for selected library"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>                    <div className="space-y-4">
                      {overviewData?.topLibraries && Array.isArray(overviewData.topLibraries) ? (overviewData.topLibraries as TopLibrary[]).map((library: TopLibrary, i: number) => (
                        <div key={i} className="flex items-center  shadow-gray/70 shadow-lg justify-between rounded-lg bg-muted/50 p-4">
                          <div>
                            <h3 className="font-medium">{library.name}</h3>
                            <p className="text-sm text-muted-foreground">{library.members} members • {library.city}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{library.rating}/5 ⭐</p>
                            <p className="text-sm text-muted-foreground">{library.bookings} bookings</p>
                          </div>
                        </div>
                      )) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="mt-4 space-y-6">
          {revenueData && (
            <Card className="bg-white border-0">
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Revenue by payment type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Membership Fees:</span>
                      <span className="font-medium">₹{(revenueData.revenueBreakdown as RevenueBreakdown)?.membership?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Seat Bookings:</span>
                      <span className="font-medium">₹{(revenueData.revenueBreakdown as RevenueBreakdown)?.seatBooking?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Penalties:</span>
                      <span className="font-medium">₹{(revenueData.revenueBreakdown as RevenueBreakdown)?.penalty?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>E-Book Purchases:</span>
                      <span className="font-medium">₹{(revenueData.revenueBreakdown as RevenueBreakdown)?.eBookPurchase?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other:</span>
                      <span className="font-medium">₹{(revenueData.revenueBreakdown as RevenueBreakdown)?.other?.toLocaleString()}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold">
                      <span>Total Revenue:</span>
                      <span>₹{(revenueData.totalRevenue as number)?.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="h-[300px] w-full">                    <div className="flex h-full w-full items-end justify-between gap-2">
                      {revenueData.monthlyRevenue && Array.isArray(revenueData.monthlyRevenue) ? (revenueData.monthlyRevenue as RevenueData[]).map((data: RevenueData, i: number) => {
                        const height = (data.revenue / Math.max(...(revenueData.monthlyRevenue as RevenueData[]).map((d: RevenueData) => d.revenue))) * 100
                        return (
                          <div key={i} className="relative flex h-full flex-1 flex-col justify-end">
                            <div 
                              className="w-full rounded-md bg-green-500" 
                              style={{ height: `${height}%` }}
                              title={`${data.month}: ₹${data.revenue}`}
                            ></div>
                            <span className="mt-2 text-center text-xs text-muted-foreground">{data.month}</span>
                          </div>
                        )
                      }) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-4 space-y-6">
          {userActivityData && (
            <>              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="bg-black text-white">
                  <CardHeader>
                    <CardTitle>Total Users</CardTitle>
                  </CardHeader>                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(userActivityData.summary as Summary)?.totalUsers?.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black text-white">
                  <CardHeader>
                    <CardTitle>Active Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(userActivityData.summary as Summary)?.totalActiveToday?.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black text-white">
                  <CardHeader>
                    <CardTitle>New This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(userActivityData.summary as Summary)?.totalNewThisMonth?.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Daily User Activity</CardTitle>
                  <CardDescription>User activity for the selected period</CardDescription>
                </CardHeader>
                <CardContent>                  <div className="space-y-4">
                    {userActivityData.dailyActivity && Array.isArray(userActivityData.dailyActivity) ? (userActivityData.dailyActivity as UserActivityData[]).slice(-7).map((activity: UserActivityData, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                        <div>
                          <h3 className="font-medium">{new Date(activity.date).toLocaleDateString()}</h3>
                          <p className="text-sm text-muted-foreground">{activity.newUsers} new users</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{activity.activeUsers} active</p>
                          <p className="text-sm text-muted-foreground">{activity.bookings} bookings</p>
                        </div>
                      </div>
                    )) : null}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="libraries" className="mt-4 space-y-6">
          {filteredLibraryPerformanceData && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {libraryFilter === "all" ? "Library Performance" : "Selected Library Performance"}
                </CardTitle>
                <CardDescription>
                  {libraryFilter === "all" 
                    ? "Performance metrics for all libraries" 
                    : `Detailed metrics for ${libraries.find(lib => lib.id === libraryFilter)?.name}`
                  }
                </CardDescription>
              </CardHeader>

              {/* //some changes here */}              <CardContent>                <div className="space-y-4">
                  {libraryPerformanceData?.libraryPerformance && Array.isArray(libraryPerformanceData.libraryPerformance) ? (libraryPerformanceData.libraryPerformance as LibraryData[]).map((library: LibraryData, i: number) => (
                    <div key={library.id || i} className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                      <div>
                        <h3 className="font-medium">{library.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {library.city}, {library.state} • {library.members} members
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{library.revenue?.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {library.bookings} bookings • {library.occupancyRate}% occupancy
                        </p>
                      </div>
                    </div>
                  )) : null}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
