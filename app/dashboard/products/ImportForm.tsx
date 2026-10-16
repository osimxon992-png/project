'use client'

import { useActionState } from 'react'
import { keepValues } from '../../submit'
import { importProducts, type FormState } from '../actions'

export function ImportForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(importProducts, {})
  return (
    <form onSubmit={keepValues(action)} className="form">
      <label>
        <span>Fayl (.csv, .xlsx)</span>
        <input type="file" name="file" required accept=".csv,.xlsx,.xls" />
      </label>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      {state.errors && (
        <ul className="error" role="alert">
          {state.errors.slice(0, 20).map((e) => <li key={e}>{e}</li>)}
          {state.errors.length > 20 && <li>… yana {state.errors.length - 20} ta xato</li>}
        </ul>
      )}
      {state.ok && <p className="ok" role="status">{state.ok}</p>}
      <button className="btn" disabled={pending}>{pending ? 'Yuklanmoqda…' : 'Yuklash'}</button>
    </form>
  )
}
