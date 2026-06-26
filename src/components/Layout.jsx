import { LayoutDashboard, ListChecks, CheckCircle2, Plus, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

const NAV = [
  { id: 'dashboard', label: 'Resumo', Icon: LayoutDashboard },
  { id: 'ativas',    label: 'Ativas',  Icon: ListChecks },
  { id: 'quitadas',  label: 'Quitadas', Icon: CheckCircle2 },
]

export default function Layout({ children, currentPage, setCurrentPage, onNewDivida }) {
  const toast = useToast()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.info('Até logo!')
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#0A0A0A]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-3 border-b border-surface-border sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-md z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <span className="text-white font-black text-sm">D</span>
          </div>
          <span className="font-bold text-white text-base tracking-tight">Gestor de Dívidas</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-surface-raised transition-colors"
          title="Sair"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-28">
        {children}
      </main>

      {/* FAB */}
      <button
        onClick={onNewDivida}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-brand shadow-lg shadow-brand/40 flex items-center justify-center active:scale-90 transition-transform"
        aria-label="Nova dívida"
      >
        <Plus size={26} className="text-white" />
      </button>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-surface-border bottom-nav-safe">
        <div className="flex items-center">
          {NAV.map(({ id, label, Icon }) => {
            const active = currentPage === id
            return (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  active ? 'text-brand' : 'text-gray-600'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-${active ? 'semibold' : 'medium'}`}>{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
