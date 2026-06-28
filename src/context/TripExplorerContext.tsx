import { createContext, useContext } from 'react'

const TripExplorerContext = createContext<string>('')

export function TripExplorerProvider({ basePath, children }: { basePath: string; children: React.ReactNode }) {
  return <TripExplorerContext.Provider value={basePath}>{children}</TripExplorerContext.Provider>
}

export function useBasePath() {
  return useContext(TripExplorerContext)
}
