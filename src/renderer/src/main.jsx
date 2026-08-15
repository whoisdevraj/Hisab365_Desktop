import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './assets/main.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Since we are reading from a local SQLite DB, we don't need to refetch on window focus
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5 // Data stays fresh for 5 minutes
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
