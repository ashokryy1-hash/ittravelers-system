import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { SessionProvider } from './context/SessionContext'
import { TripExplorerProvider } from './context/TripExplorerContext'
import HomeScreen from './screens/HomeScreen'
import DestinationScreen from './screens/DestinationScreen'
import VietnamScreen from './screens/VietnamScreen'
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
import ToursScreen from './hms/screens/ToursScreen'
import LeadsScreen from './hms/screens/LeadsScreen'
import TripExplorerModule from './hms/screens/TripExplorerModule'
import InboxScreen from './hms/screens/InboxScreen'

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
            <Route path="/" element={<TripExplorerProvider basePath=""><HomeScreen /></TripExplorerProvider>} />
            <Route path="/bali" element={<TripExplorerProvider basePath=""><DestinationScreen /></TripExplorerProvider>} />
            <Route path="/bali/:cityId" element={<TripExplorerProvider basePath=""><AreaScreen /></TripExplorerProvider>} />
            <Route path="/vietnam" element={<TripExplorerProvider basePath=""><VietnamScreen /></TripExplorerProvider>} />
            <Route path="/vietnam/:cityId" element={<TripExplorerProvider basePath=""><AreaScreen /></TripExplorerProvider>} />
            <Route path="/summary" element={<TripExplorerProvider basePath=""><SummaryScreen /></TripExplorerProvider>} />
            <Route path="/admin" element={<AdminScreen />} />

            {/* Sales team rate portal — PIN protected, no HMS login needed */}
            <Route path="/sales" element={<SalesPortalScreen />} />

            {/* Internal Hotel Management System */}
            <Route path="/hms" element={<HmsRoot />}>
              <Route element={<HmsLayout />}>
                <Route index element={<DashboardScreen />} />
                <Route path="leads" element={<LeadsScreen />} />
                <Route path="discovery" element={<DiscoveryScreen />} />
                <Route path="outreach" element={<OutreachScreen />} />
                <Route path="rates" element={<RatesScreen />} />
                <Route path="rates/quote" element={<RateViewerScreen />} />
                <Route path="reservations" element={<ReservationsScreen />} />
                <Route path="tours" element={<ToursScreen />} />
                <Route path="trip-explorer/*" element={<TripExplorerModule />} />
                <Route path="inbox" element={<InboxScreen />} />
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
