import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ToastProvider } from './context/ToastContext'
import { DividasProvider, useDividas } from './context/DividasContext'
import AuthPage from './components/auth/AuthPage'
import Layout from './components/Layout'
import Dashboard from './components/dashboard/Dashboard'
import DividasList from './components/dividas/DividasList'
import DividaForm from './components/dividas/DividaForm'
import DividaDetail from './components/dividas/DividaDetail'

function AppContent({ userId }) {
  const { dividas } = useDividas()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [showForm, setShowForm] = useState(false)
  const [editingDivida, setEditingDivida] = useState(null)
  const [viewDividaId, setViewDividaId] = useState(null)

  const viewDivida = viewDividaId ? dividas.find(d => d.id === viewDividaId) ?? null : null

  function openNew() {
    setEditingDivida(null)
    setShowForm(true)
  }

  function openEdit(d) {
    setEditingDivida(d)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingDivida(null)
  }

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage} onNewDivida={openNew}>
      {currentPage === 'dashboard' && (
        <Dashboard setCurrentPage={setCurrentPage} />
      )}
      {currentPage === 'ativas' && (
        <DividasList status="ativa" onSelectDivida={setViewDividaId} />
      )}
      {currentPage === 'quitadas' && (
        <DividasList status="quitada" onSelectDivida={setViewDividaId} />
      )}

      {showForm && (
        <DividaForm
          divida={editingDivida}
          onClose={closeForm}
          onSaved={closeForm}
        />
      )}

      {viewDivida && (
        <DividaDetail
          divida={viewDivida}
          onClose={() => setViewDividaId(null)}
          onEdit={(d) => {
            setViewDividaId(null)
            openEdit(d)
          }}
          onDeleted={() => setViewDividaId(null)}
        />
      )}
    </Layout>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-500 text-sm">Carregando…</p>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return <LoadingScreen />

  if (!session) {
    return (
      <ToastProvider>
        <AuthPage />
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <DividasProvider userId={session.user.id}>
        <AppContent userId={session.user.id} />
      </DividasProvider>
    </ToastProvider>
  )
}
