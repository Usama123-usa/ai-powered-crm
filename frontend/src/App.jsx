import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import LeadDetail from './pages/LeadDetail'
import Leads from './pages/Leads'
import Tasks from './pages/Tasks'
import Team from './pages/Team'
import Settings from './pages/Settings'
import LeadForm from './pages/LeadForm'
import Meetings from './pages/Meetings'
import Analytics from './pages/Analytics'
import FollowUp from './pages/FollowUp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/form" element={<LeadForm />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

function MainLayout() {
  return (
    <div className="flex h-screen bg-app overflow-hidden">
      <Navbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/followup" element={<FollowUp />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
