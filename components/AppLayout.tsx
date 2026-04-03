import AuthGuard from '../lib/authGuard'
import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
  noscroll?: boolean
}

export default function AppLayout({ children, noscroll }: AppLayoutProps) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden ambient-bg">
        <Sidebar />
        <main className={`flex-1 relative z-10 ${noscroll ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
