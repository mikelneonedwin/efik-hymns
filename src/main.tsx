import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'
import Hymns from "./hymns.ts"

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  }
})

// Periodically check for new releases in the background (every hour) and when tab regains focus or reconnects
setInterval(() => {
  updateSW(true)
}, 60 * 60 * 1000)

window.addEventListener('online', () => {
  updateSW(true)
})

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: Hymns
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)