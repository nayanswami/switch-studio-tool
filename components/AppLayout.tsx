import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
  /**
   * When true the main content area won't scroll itself — useful for
   * split-screen layouts that manage their own panel scrolling.
   */
  noscroll?: boolean
}

export default function AppLayout({ children, noscroll }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden ambient-bg">
      <Sidebar />
      <main className={`flex-1 relative z-10 ${noscroll ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
        {children}
      </main>
    </div>
  )
}
