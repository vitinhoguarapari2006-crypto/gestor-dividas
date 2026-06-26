import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'
import { CreditCard, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function AuthPage() {
  const toast = useToast()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success('Conta criada! Verifique seu e-mail se necessário.')
      }
    } catch (err) {
      const msg = err.message?.includes('Invalid login')
        ? 'E-mail ou senha incorretos.'
        : err.message?.includes('already registered')
        ? 'E-mail já cadastrado. Faça login.'
        : err.message || 'Algo deu errado.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 bg-[#0A0A0A]">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
          <CreditCard size={32} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestor de Dívidas</h1>
          <p className="text-sm text-gray-500 mt-1">Controle total das suas parcelas</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm card">
        {/* Tabs */}
        <div className="flex bg-surface-raised rounded-xl p-1 mb-6">
          {['login', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === m ? 'bg-brand text-white shadow' : 'text-gray-400'
              }`}
            >
              {m === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="label">E-mail</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                className="input-field pl-10"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="label">Senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPwd ? 'text' : 'password'}
                className="input-field pl-10 pr-10"
                placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>

      <p className="text-xs text-gray-600 mt-6 text-center max-w-xs">
        Seus dados ficam isolados na sua conta — ninguém mais vê suas dívidas.
      </p>
    </div>
  )
}
