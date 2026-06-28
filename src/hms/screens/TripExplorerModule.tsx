import { Routes, Route } from 'react-router-dom'
import { TripExplorerProvider } from '../../context/TripExplorerContext'
import HomeScreen from '../../screens/HomeScreen'
import DestinationScreen from '../../screens/DestinationScreen'
import VietnamScreen from '../../screens/VietnamScreen'
import AreaScreen from '../../screens/AreaScreen'
import SummaryScreen from '../../screens/SummaryScreen'
import AdminScreen from '../../screens/AdminScreen'
import SessionsScreen from '../../screens/SessionsScreen'

const BASE = '/hms/trip-explorer'

export default function TripExplorerModule() {
  return (
    <TripExplorerProvider basePath={BASE}>
      <Routes>
        <Route index element={<HomeScreen />} />
        <Route path="bali" element={<DestinationScreen />} />
        <Route path="bali/:cityId" element={<AreaScreen />} />
        <Route path="vietnam" element={<VietnamScreen />} />
        <Route path="vietnam/:cityId" element={<AreaScreen />} />
        <Route path="summary" element={<SummaryScreen />} />
        <Route path="sessions" element={<SessionsScreen />} />
        <Route path="admin" element={<AdminScreen />} />
      </Routes>
    </TripExplorerProvider>
  )
}
