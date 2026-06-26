import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const DividasContext = createContext(null)

export function DividasProvider({ children, userId }) {
  const [dividas, setDividas] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dRes, pRes] = await Promise.all([
        supabase.from('dividas').select('*').order('created_at', { ascending: false }),
        supabase.from('pagamentos').select('*').order('created_at', { ascending: false }),
      ])
      if (dRes.error) throw dRes.error
      if (pRes.error) throw pRes.error
      setDividas(dRes.data ?? [])
      setPagamentos(pRes.data ?? [])
    } catch (err) {
      console.error('fetchData error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addDivida = async (data) => {
    const { data: row, error } = await supabase
      .from('dividas')
      .insert([{ ...data, user_id: userId }])
      .select()
      .single()
    if (error) throw error
    setDividas(prev => [row, ...prev])
    return row
  }

  const updateDivida = async (id, data) => {
    const { data: row, error } = await supabase
      .from('dividas')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setDividas(prev => prev.map(d => (d.id === id ? row : d)))
    return row
  }

  const deleteDivida = async (id) => {
    const { error } = await supabase.from('dividas').delete().eq('id', id)
    if (error) throw error
    setDividas(prev => prev.filter(d => d.id !== id))
    setPagamentos(prev => prev.filter(p => p.divida_id !== id))
  }

  const marcarParcelaPaga = async (divida) => {
    const novasPagas = divida.parcelas_pagas + 1
    const novoStatus = novasPagas >= divida.total_parcelas ? 'quitada' : 'ativa'

    const { data: divRow, error: e1 } = await supabase
      .from('dividas')
      .update({ parcelas_pagas: novasPagas, status: novoStatus })
      .eq('id', divida.id)
      .select()
      .single()
    if (e1) throw e1

    const { data: pagRow, error: e2 } = await supabase
      .from('pagamentos')
      .insert([{
        user_id: userId,
        divida_id: divida.id,
        numero_parcela: novasPagas,
        valor_pago: divida.valor_parcela,
        data_pagamento: new Date().toISOString().split('T')[0],
      }])
      .select()
      .single()
    if (e2) throw e2

    setDividas(prev => prev.map(d => (d.id === divida.id ? divRow : d)))
    setPagamentos(prev => [pagRow, ...prev])
    return { divida: divRow, pagamento: pagRow }
  }

  const desfazerPagamento = async (divida) => {
    if (divida.parcelas_pagas === 0) throw new Error('Nenhuma parcela para desfazer')

    const ultimo = pagamentos
      .filter(p => p.divida_id === divida.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    if (!ultimo) throw new Error('Histórico de pagamento não encontrado')

    const novasPagas = divida.parcelas_pagas - 1

    const { data: divRow, error: e1 } = await supabase
      .from('dividas')
      .update({ parcelas_pagas: novasPagas, status: 'ativa' })
      .eq('id', divida.id)
      .select()
      .single()
    if (e1) throw e1

    const { error: e2 } = await supabase.from('pagamentos').delete().eq('id', ultimo.id)
    if (e2) throw e2

    setDividas(prev => prev.map(d => (d.id === divida.id ? divRow : d)))
    setPagamentos(prev => prev.filter(p => p.id !== ultimo.id))
    return divRow
  }

  return (
    <DividasContext.Provider value={{
      dividas,
      pagamentos,
      loading,
      fetchData,
      addDivida,
      updateDivida,
      deleteDivida,
      marcarParcelaPaga,
      desfazerPagamento,
    }}>
      {children}
    </DividasContext.Provider>
  )
}

export function useDividas() {
  const ctx = useContext(DividasContext)
  if (!ctx) throw new Error('useDividas must be used inside DividasProvider')
  return ctx
}
