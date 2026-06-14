import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { SessionProvider } from './context/SessionContext'
import HomeScreen from './screens/HomeScreen'
import DestinationScreen from './screens/DestinationScreen'
import AreaScreen from './screens/AreaScreen'
import SummaryScreen from './screens/SummaryScreen'
import AdminScreen from './screens/AdminScreen'

// HMS
import HmsRoot from './hms/HmsRoot'
import HmsLayout from './hms/components/HmsLayout'
import DashboardScreen from './hms/screens/DashboardScreen'
import DiscoveryScreen from './hms/screens/DiscoveryScreen'
import OutreachScreen from './hms/screens/OutreachScreen'
import RatesScreen from './hms/screens/RatesScreen'
import RateViewerScreen from './hms/screens/RateViewerScreen'
import ReservationsScreen from './hms/screens/ReservationsScreen'
import SettingsScreen from './hms/screens/SettingsScreen'
import SalesPortalScreen from './hms/screens/SalesPortalScreen'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <BrowserRouter>
          <Routes>
            {/* Public-facing tour explorer */}
            <Route path="/" element={<HomeScreen />} />
            <Route path="/bali" element={<DestinationScreen />} />
            <Route path="/bali/:cityId" element={<AreaScreen />} />
            <Route path="/summary" element={<SummaryScreen />} />
            <Route path="/admin" element={<AdminScreen />} />

            {/* Sales team rate portal — PIN protected, no HMS login needed */}
            <Route path="/sales" element={<SalesPortalScreen />} />

            {/* Internal Hotel Management System */}
            <Route path="/hms" element={<HmsRoot />}>
              <Route element={<HmsLayout />}>
                <Route index element={<DashboardScreen />} />
                <Route path="discovery" element={<DiscoveryScreen />} />
                <Route path="outreach" element={<OutreachScreen />} />
                <Route path="rates" element={<RatesScreen />} />
                <Route path="rates/quote" element={<RateViewerScreen />} />
                <Route path="reservations" element={<ReservationsScreen />} />
                <Route path="settings" element={<SettingsScreen />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-center" />
      </SessionProvider>
    </QueryClientProvider>
  )
}
