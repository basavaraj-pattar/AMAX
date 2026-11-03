import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App, { ScrollToTop } from './App'
import GlobalSmoothScroll from './features/GlobalSmoothScroll'
import 'lenis/dist/lenis.css'
import './styles.css'
import './logo-theme.css'
import './features/ProfileWorkActions.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><GlobalSmoothScroll /><ScrollToTop /><App /></BrowserRouter></React.StrictMode>
)
