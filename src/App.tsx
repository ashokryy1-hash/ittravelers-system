import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { SessionProvider } from './context/SessionContext'
import HomeScreen from './screens/HomeScreen'
import DestinationScreen from './screens/DestinationScreen'
import AreaScreen from './screens/AreaScreen'
import SummaryScreen from './screens/SummaryScreen'
import AdminScreen from './screens/AdminScreen'

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
            <Route path="/" element={<HomeScreen />} />
            <Route path="/bali" element={<DestinationScreen />} />
            <Route path="/bali/:cityId" element={<AreaScreen />} />
            <Route path="/summary" element={<SummaryScreen />} />
            <Route path="/admin" element={<AdminScreen />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-center" />
      </SessionProvider>
    </QueryClientProvider>
  )
}
