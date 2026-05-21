import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import PublicProfile from './components/PublicProfile'

const pathParts = window.location.pathname.split("/").filter(Boolean);
const profileSlug = pathParts[0] === "u" && pathParts[1] ? pathParts[1] : null;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {profileSlug ? <PublicProfile slug={profileSlug} /> : <App />}
  </React.StrictMode>,
)
