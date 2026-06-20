import { useState } from 'react'
import './TiendaAuth.css'

const API = `${import.meta.env.VITE_API_URL}/api/auth`

// ─── Validaciones ─────────────────────────────────────────────
const validarCorreo = v => {
  if (!v.trim()) return 'El correo es obligatorio.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Ingresa un correo válido.'
  return ''
}
const validarContrasena = v => {
  if (!v) return 'La contraseña es obligatoria.'
  if (v.length < 6) return 'Mínimo 6 caracteres.'
  if (!/[a-z]/.test(v)) return 'Debe tener al menos una minúscula.'
  if (!/[A-Z]/.test(v)) return 'Debe tener al menos una mayúscula.'
  if (!/[0-9]/.test(v)) return 'Debe tener al menos un número.'
  return ''
}
const validarNombre = (v, campo) => {
  if (!v.trim()) return `${campo} es obligatorio.`
  if (v.trim().length < 2) return `${campo} debe tener al menos 2 caracteres.`
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(v)) return `${campo} solo permite letras.`
  return ''
}
const validarNombreOpcional = (v, campo) => {
  if (!v.trim()) return ''
  if (v.trim().length < 2) return `${campo} debe tener al menos 2 caracteres.`
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(v)) return `${campo} solo permite letras.`
  return ''
}
const validarFechaNacimiento = v => {
  if (!v) return 'La fecha de nacimiento es obligatoria.'
  const nacimiento = new Date(v)
  if (isNaN(nacimiento.getTime())) return 'La fecha de nacimiento no es válida.'
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const m = hoy.getMonth() - nacimiento.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--
  if (edad < 18) return 'Debes ser mayor de 18 años para registrarte.'
  return ''
}

// ─── Campo con error ───────────────────────────────────────────
const FieldError = ({ msg }) => msg
  ? <p className="ta-field-error"><i className="bi bi-exclamation-circle"></i> {msg}</p>
  : null

// ─── Inputs de código ─────────────────────────────────────────
function CodeInputs({ value, onChange }) {
  const digits = value.split('')
  const handleKey = (e, i) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      document.getElementById(`code-${i - 1}`)?.focus()
    }
  }
  const handleChange = (e, i) => {
    const val = e.target.value.replace(/\D/, '')
    if (!val) {
      const next = [...digits]
      next[i] = ''
      onChange(next.join(''))
      return
    }
    const next = [...digits]
    next[i] = val[val.length - 1]
    onChange(next.join(''))
    if (i < 5) document.getElementById(`code-${i + 1}`)?.focus()
  }
  return (
    <div className="ta-code-row">
      {[0,1,2,3,4,5].map(i => (
        <input
          key={i}
          id={`code-${i}`}
          className="ta-code-input"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKey(e, i)}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════
// PANEL LOGIN
// ═══════════════════════════════════════
function PanelLogin({ onSwitch, onSuccess }) {
  const [form, setForm]       = useState({ correo: '', contrasena: '' })
  const [errors, setErrors]   = useState({})
  const [serverErr, setServerErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const validate = () => {
    const e = {
      correo:    validarCorreo(form.correo),
      contrasena: form.contrasena ? '' : 'La contraseña es obligatoria.'
    }
    setErrors(e)
    return !Object.values(e).some(Boolean)
  }

  const submit = async () => {
    setServerErr('')
    if (!validate()) return
    setLoading(true)
    try {
      const res  = await fetch(`${API}/login-cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { setServerErr(data.error || 'Error al iniciar sesión.'); return }
      sessionStorage.setItem('tiendaSesion', JSON.stringify(data))
      onSuccess()
    } catch {
      setServerErr('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ta-panel">
      <div className="ta-logo">✦ MODA MÁGICA ✦</div>
      <h2 className="ta-title">Iniciar sesión</h2>
      <p className="ta-subtitle">Accede a tu cuenta para comprar</p>

      {serverErr && (
        <div className="ta-server-error">
          <i className="bi bi-exclamation-triangle"></i> {serverErr}
        </div>
      )}

      <div className="ta-form-group">
        <label className="ta-label">Correo electrónico</label>
        <input
          className={`ta-input ${errors.correo ? 'error' : ''}`}
          type="text"
         
          value={form.correo}
          onChange={e => { setForm({...form, correo: e.target.value}); setErrors(er => ({...er, correo: validarCorreo(e.target.value)})) }}
          onBlur={() => setErrors(er => ({...er, correo: validarCorreo(form.correo)}))}
        />
        <FieldError msg={errors.correo} />
      </div>

      <div className="ta-form-group">
        <label className="ta-label">Contraseña</label>
        <div className="ta-pass-wrap">
          <input
            className={`ta-input ${errors.contrasena ? 'error' : ''}`}
            type={showPass ? 'text' : 'password'}
           
            value={form.contrasena}
            onChange={e => setForm({...form, contrasena: e.target.value})}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
          <button className="ta-pass-toggle" onClick={() => setShowPass(v => !v)} type="button">
            <i className={`bi bi-eye${showPass ? '-slash' : ''}`}></i>
          </button>
        </div>
        <FieldError msg={errors.contrasena} />
      </div>

      <div className="ta-forgot-row">
        <button className="ta-link" onClick={() => onSwitch('recovery')}>¿Olvidaste tu contraseña?</button>
      </div>

      <button className="ta-btn-primary" onClick={submit} disabled={loading}>
        {loading ? <span className="ta-spinner"></span> : 'Iniciar sesión'}
      </button>

      <p className="ta-switch-text">
        ¿No tienes cuenta?{' '}
        <button className="ta-link bold" onClick={() => onSwitch('register')}>Regístrate</button>
      </p>

      <div className="ta-divider"><span>o</span></div>

      <a href="/tienda" className="ta-btn-secondary">
        <i className="bi bi-bag"></i> Continuar sin cuenta
      </a>
    </div>
  )
}

// ═══════════════════════════════════════
// PANEL REGISTRO
// ═══════════════════════════════════════
function PanelRegistro({ onSwitch, onVerify }) {
  const [step, setStep]     = useState(1) // 1: datos, 2: verificar
  const [userId, setUserId] = useState(null)
  const [form, setForm]     = useState({
    primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '',
    correo: '', contrasena: '', confirmar: '',
    telefono: '', direccion: '', fecha_nacimiento: ''
  })
  const [errors, setErrors]     = useState({})
  const [serverErr, setServerErr] = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [codigo, setCodigo]     = useState('')
  const [codeErr, setCodeErr]   = useState('')
  const [resendMsg, setResendMsg] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  const set = (k, v) => setForm(f => ({...f, [k]: v}))
  const err = (k, v) => setErrors(e => ({...e, [k]: v}))

  const validarTodo = () => {
    const e = {
      primer_nombre:  validarNombre(form.primer_nombre, 'El nombre'),
      segundo_nombre: validarNombreOpcional(form.segundo_nombre, 'El segundo nombre'),
      primer_apellido: validarNombre(form.primer_apellido, 'El apellido'),
      segundo_apellido: validarNombreOpcional(form.segundo_apellido, 'El segundo apellido'),
      correo:         validarCorreo(form.correo),
      contrasena:     validarContrasena(form.contrasena),
      confirmar:      form.confirmar !== form.contrasena ? 'Las contraseñas no coinciden.' : '',
      telefono:       !form.telefono.trim() ? 'El teléfono es obligatorio.' : !/^\d{7,15}$/.test(form.telefono.trim()) ? 'Solo números, entre 7 y 15 dígitos.' : '',
      direccion:      !form.direccion.trim() ? 'La dirección es obligatoria.' : '',
      fecha_nacimiento: validarFechaNacimiento(form.fecha_nacimiento),
    }
    setErrors(e)
    return !Object.values(e).some(Boolean)
  }

  const register = async () => {
    setServerErr('')
    if (!validarTodo()) return
    setLoading(true)
    try {
      const res  = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primer_nombre:    form.primer_nombre.trim(),
          segundo_nombre:   form.segundo_nombre.trim(),
          primer_apellido:  form.primer_apellido.trim(),
          segundo_apellido: form.segundo_apellido.trim(),
          correo:           form.correo.trim(),
          contrasena:       form.contrasena,
          telefono:         form.telefono.trim(),
          direccion:        form.direccion.trim(),
          fecha_nacimiento: form.fecha_nacimiento,
        })
      })
      const data = await res.json()
      if (!res.ok) { setServerErr(data.error || 'Error al registrar.'); return }
      setUserId(data.userId)
      setStep(2)
      startResendTimer()
    } catch {
      setServerErr('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  const startResendTimer = () => {
    setResendTimer(60)
    const interval = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
  }

  const verify = async () => {
    setCodeErr('')
    if (codigo.length < 6) { setCodeErr('Ingresa los 6 dígitos.'); return }
    setLoading(true)
    try {
      const res  = await fetch(`${API}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, codigo })
      })
      const data = await res.json()
      if (!res.ok) { setCodeErr(data.error || 'Código incorrecto.'); return }
      onVerify()
    } catch {
      setCodeErr('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (resendTimer > 0) return
    setResendMsg('')
    try {
      await fetch(`${API}/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      setResendMsg('Nuevo código enviado 📧')
      startResendTimer()
    } catch {
      setResendMsg('Error al reenviar.')
    }
  }

  if (step === 2) return (
    <div className="ta-panel">
      <div className="ta-logo">✦ MODA MÁGICA ✦</div>
      <div className="ta-verify-icon"><i className="bi bi-envelope-check"></i></div>
      <h2 className="ta-title">Verifica tu correo</h2>
      <p className="ta-subtitle">Enviamos un código de 6 dígitos a<br/><strong>{form.correo}</strong></p>

      <CodeInputs value={codigo} onChange={setCodigo} />
      <FieldError msg={codeErr} />

      {resendMsg && <p className="ta-resend-msg">{resendMsg}</p>}

      <button className="ta-btn-primary" onClick={verify} disabled={loading} style={{marginTop: 20}}>
        {loading ? <span className="ta-spinner"></span> : 'Verificar cuenta'}
      </button>

      <p className="ta-switch-text" style={{marginTop: 14}}>
        ¿No recibiste el código?{' '}
        <button className="ta-link bold" onClick={resend} disabled={resendTimer > 0}>
          {resendTimer > 0 ? `Reenviar en ${resendTimer}s` : 'Reenviar'}
        </button>
      </p>

      <button className="ta-btn-ghost" onClick={() => setStep(1)}>
        <i className="bi bi-arrow-left"></i> Volver
      </button>
    </div>
  )

  return (
    <div className="ta-panel">
      <div className="ta-logo">✦ MODA MÁGICA ✦</div>
      <h2 className="ta-title">Crear cuenta</h2>
      <p className="ta-subtitle">Únete a Moda Mágica y empieza a comprar</p>

      {serverErr && (
        <div className="ta-server-error">
          <i className="bi bi-exclamation-triangle"></i> {serverErr}
        </div>
      )}

      <div className="ta-grid-2">
        <div className="ta-form-group">
          <label className="ta-label">Primer nombre <span className="ta-req">*</span></label>
          <input className={`ta-input ${errors.primer_nombre ? 'error' : ''}`}
            value={form.primer_nombre}
            onChange={e => { set('primer_nombre', e.target.value); err('primer_nombre', validarNombre(e.target.value, 'El nombre')) }}
            onBlur={() => err('primer_nombre', validarNombre(form.primer_nombre, 'El nombre'))} />
          <FieldError msg={errors.primer_nombre} />
        </div>
        <div className="ta-form-group">
          <label className="ta-label">Segundo nombre</label>
          <input className={`ta-input ${errors.segundo_nombre ? 'error' : ''}`}
            value={form.segundo_nombre}
            onChange={e => { set('segundo_nombre', e.target.value); err('segundo_nombre', validarNombreOpcional(e.target.value, 'El segundo nombre')) }}
            onBlur={() => err('segundo_nombre', validarNombreOpcional(form.segundo_nombre, 'El segundo nombre'))} />
          <FieldError msg={errors.segundo_nombre} />
        </div>
      </div>

      <div className="ta-grid-2">
        <div className="ta-form-group">
          <label className="ta-label">Primer apellido <span className="ta-req">*</span></label>
          <input className={`ta-input ${errors.primer_apellido ? 'error' : ''}`}
            value={form.primer_apellido}
            onChange={e => { set('primer_apellido', e.target.value); err('primer_apellido', validarNombre(e.target.value, 'El apellido')) }}
            onBlur={() => err('primer_apellido', validarNombre(form.primer_apellido, 'El apellido'))} />
          <FieldError msg={errors.primer_apellido} />
        </div>
        <div className="ta-form-group">
          <label className="ta-label">Segundo apellido</label>
          <input className={`ta-input ${errors.segundo_apellido ? 'error' : ''}`}
            value={form.segundo_apellido}
            onChange={e => { set('segundo_apellido', e.target.value); err('segundo_apellido', validarNombreOpcional(e.target.value, 'El segundo apellido')) }}
            onBlur={() => err('segundo_apellido', validarNombreOpcional(form.segundo_apellido, 'El segundo apellido'))} />
          <FieldError msg={errors.segundo_apellido} />
        </div>
      </div>

      <div className="ta-form-group">
        <label className="ta-label">Correo electrónico <span className="ta-req">*</span></label>
        <input className={`ta-input ${errors.correo ? 'error' : ''}`}
          value={form.correo}
          onChange={e => { set('correo', e.target.value); err('correo', validarCorreo(e.target.value)) }}
          onBlur={() => err('correo', validarCorreo(form.correo))} />
        <FieldError msg={errors.correo} />
      </div>

      <div className="ta-grid-2">
        <div className="ta-form-group">
          <label className="ta-label">Teléfono <span className="ta-req">*</span></label>
          <input className={`ta-input ${errors.telefono ? 'error' : ''}`}
            value={form.telefono}
            onChange={e => { set('telefono', e.target.value); err('telefono', '') }}
            onBlur={() => err('telefono', !form.telefono.trim() ? 'El teléfono es obligatorio.' : !/^\d{7,15}$/.test(form.telefono.trim()) ? 'Solo números, entre 7 y 15 dígitos.' : '')} />
          <FieldError msg={errors.telefono} />
        </div>
        <div className="ta-form-group">
          <label className="ta-label">Fecha de nacimiento <span className="ta-req">*</span></label>
          <input className={`ta-input ${errors.fecha_nacimiento ? 'error' : ''}`}
            type="date"
            value={form.fecha_nacimiento}
            onChange={e => { set('fecha_nacimiento', e.target.value); err('fecha_nacimiento', validarFechaNacimiento(e.target.value)) }}
            onBlur={() => err('fecha_nacimiento', validarFechaNacimiento(form.fecha_nacimiento))} />
          <FieldError msg={errors.fecha_nacimiento} />
        </div>
      </div>

      <div className="ta-form-group">
        <label className="ta-label">Dirección <span className="ta-req">*</span></label>
        <input className={`ta-input ${errors.direccion ? 'error' : ''}`}
          value={form.direccion}
          onChange={e => { set('direccion', e.target.value); err('direccion', e.target.value.trim() ? '' : 'La dirección es obligatoria.') }}
          onBlur={() => err('direccion', form.direccion.trim() ? '' : 'La dirección es obligatoria.')} />
        <FieldError msg={errors.direccion} />
      </div>

      <div className="ta-form-group">
        <label className="ta-label">Contraseña <span className="ta-req">*</span></label>
        <div className="ta-pass-wrap">
          <input className={`ta-input ${errors.contrasena ? 'error' : ''}`}
            type={showPass ? 'text' : 'password'}
            value={form.contrasena}
            onChange={e => { set('contrasena', e.target.value); err('contrasena', validarContrasena(e.target.value)) }}
            onBlur={() => err('contrasena', validarContrasena(form.contrasena))} />
          <button className="ta-pass-toggle" onClick={() => setShowPass(v => !v)} type="button">
            <i className={`bi bi-eye${showPass ? '-slash' : ''}`}></i>
          </button>
        </div>
        <FieldError msg={errors.contrasena} />
      </div>

      <div className="ta-form-group">
        <label className="ta-label">Confirmar contraseña <span className="ta-req">*</span></label>
        <div className="ta-pass-wrap">
          <input className={`ta-input ${errors.confirmar ? 'error' : ''}`}
            type={showConf ? 'text' : 'password'}
            value={form.confirmar}
            onChange={e => { set('confirmar', e.target.value); err('confirmar', e.target.value !== form.contrasena ? 'Las contraseñas no coinciden.' : '') }}
            onBlur={() => err('confirmar', form.confirmar !== form.contrasena ? 'Las contraseñas no coinciden.' : '')} />
          <button className="ta-pass-toggle" onClick={() => setShowConf(v => !v)} type="button">
            <i className={`bi bi-eye${showConf ? '-slash' : ''}`}></i>
          </button>
        </div>
        <FieldError msg={errors.confirmar} />
      </div>

      <button className="ta-btn-primary" onClick={register} disabled={loading}>
        {loading ? <span className="ta-spinner"></span> : 'Crear cuenta'}
      </button>

      <p className="ta-switch-text">
        ¿Ya tienes cuenta?{' '}
        <button className="ta-link bold" onClick={() => onSwitch('login')}>Inicia sesión</button>
      </p>
    </div>
  )
}

// ═══════════════════════════════════════
// PANEL RECUPERAR CONTRASEÑA
// ═══════════════════════════════════════
function PanelRecovery({ onSwitch }) {
  const [step, setStep]         = useState(1) // 1: correo, 2: código, 3: nueva pass
  const [correo, setCorreo]     = useState('')
  const [correoErr, setCorreoErr] = useState('')
  const [userId, setUserId]     = useState(null)
  const [codigo, setCodigo]     = useState('')
  const [codeErr, setCodeErr]   = useState('')
  const [pass, setPass]         = useState('')
  const [conf, setConf]         = useState('')
  const [passErr, setPassErr]   = useState('')
  const [confErr, setConfErr]   = useState('')
  const [serverErr, setServerErr] = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const startTimer = () => {
    setResendTimer(60)
    const iv = setInterval(() => setResendTimer(t => { if (t <= 1) { clearInterval(iv); return 0 } return t - 1 }), 1000)
  }

  // Paso 1: enviar correo para obtener código
  const sendCode = async () => {
    const e = validarCorreo(correo)
    setCorreoErr(e)
    if (e) return
    setLoading(true)
    setServerErr('')
    try {
      const res  = await fetch(`${API}/recovery-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: correo.trim() })
      })
      const data = await res.json()
      if (!res.ok) { setServerErr(data.error || 'Error al enviar código.'); return }
      setUserId(data.userId)
      setStep(2)
      startTimer()
    } catch {
      setServerErr('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  // Paso 2: verificar código
  const verifyCode = async () => {
    setCodeErr('')
    if (codigo.length < 6) { setCodeErr('Ingresa los 6 dígitos.'); return }
    setLoading(true)
    try {
      const res  = await fetch(`${API}/recovery-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, codigo })
      })
      const data = await res.json()
      if (!res.ok) { setCodeErr(data.error || 'Código incorrecto.'); return }
      setStep(3)
    } catch {
      setCodeErr('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  // Paso 3: cambiar contraseña
  const changePass = async () => {
    const pe = validarContrasena(pass)
    const ce = pass !== conf ? 'Las contraseñas no coinciden.' : ''
    setPassErr(pe); setConfErr(ce)
    if (pe || ce) return
    setLoading(true)
    setServerErr('')
    try {
      const res  = await fetch(`${API}/recovery-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, nuevaContrasena: pass })
      })
      const data = await res.json()
      if (!res.ok) { setServerErr(data.error || 'Error al cambiar contraseña.'); return }
      setStep(4)
    } catch {
      setServerErr('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (resendTimer > 0) return
    try {
      await fetch(`${API}/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      startTimer()
    } catch {}
  }

  // Paso 4: éxito
  if (step === 4) return (
    <div className="ta-panel ta-center">
      <div className="ta-logo">✦ MODA MÁGICA ✦</div>
      <div className="ta-success-icon"><i className="bi bi-check-circle-fill"></i></div>
      <h2 className="ta-title">¡Contraseña actualizada!</h2>
      <p className="ta-subtitle">Ya puedes iniciar sesión con tu nueva contraseña.</p>
      <button className="ta-btn-primary" onClick={() => onSwitch('login')}>Ir al inicio de sesión</button>
    </div>
  )

  // Paso 3: nueva contraseña
  if (step === 3) return (
    <div className="ta-panel">
      <div className="ta-logo">✦ MODA MÁGICA ✦</div>
      <div className="ta-step-icon"><i className="bi bi-lock"></i></div>
      <h2 className="ta-title">Nueva contraseña</h2>
      <p className="ta-subtitle">Elige una contraseña segura para tu cuenta</p>

      {serverErr && <div className="ta-server-error"><i className="bi bi-exclamation-triangle"></i> {serverErr}</div>}

      <div className="ta-form-group">
        <label className="ta-label">Nueva contraseña</label>
        <div className="ta-pass-wrap">
          <input className={`ta-input ${passErr ? 'error' : ''}`}
            type={showPass ? 'text' : 'password'}
            value={pass}
            onChange={e => { setPass(e.target.value); setPassErr(validarContrasena(e.target.value)) }} />
          <button className="ta-pass-toggle" onClick={() => setShowPass(v => !v)} type="button">
            <i className={`bi bi-eye${showPass ? '-slash' : ''}`}></i>
          </button>
        </div>
        <FieldError msg={passErr} />
      </div>

      <div className="ta-form-group">
        <label className="ta-label">Confirmar contraseña</label>
        <input className={`ta-input ${confErr ? 'error' : ''}`}
          type="password"
          value={conf}
          onChange={e => { setConf(e.target.value); setConfErr(e.target.value !== pass ? 'Las contraseñas no coinciden.' : '') }} />
        <FieldError msg={confErr} />
      </div>

      <button className="ta-btn-primary" onClick={changePass} disabled={loading}>
        {loading ? <span className="ta-spinner"></span> : 'Guardar contraseña'}
      </button>
    </div>
  )

  // Paso 2: código
  if (step === 2) return (
    <div className="ta-panel">
      <div className="ta-logo">✦ MODA MÁGICA ✦</div>
      <div className="ta-step-icon"><i className="bi bi-envelope"></i></div>
      <h2 className="ta-title">Revisa tu correo</h2>
      <p className="ta-subtitle">Enviamos un código a<br/><strong>{correo}</strong></p>

      <CodeInputs value={codigo} onChange={setCodigo} />
      <FieldError msg={codeErr} />

      <button className="ta-btn-primary" onClick={verifyCode} disabled={loading} style={{marginTop: 20}}>
        {loading ? <span className="ta-spinner"></span> : 'Verificar código'}
      </button>

      <p className="ta-switch-text">
        ¿No recibiste el código?{' '}
        <button className="ta-link bold" onClick={resend} disabled={resendTimer > 0}>
          {resendTimer > 0 ? `Reenviar en ${resendTimer}s` : 'Reenviar'}
        </button>
      </p>

      <button className="ta-btn-ghost" onClick={() => setStep(1)}>
        <i className="bi bi-arrow-left"></i> Volver
      </button>
    </div>
  )

  // Paso 1: correo
  return (
    <div className="ta-panel">
      <div className="ta-logo">✦ MODA MÁGICA ✦</div>
      <div className="ta-step-icon"><i className="bi bi-key"></i></div>
      <h2 className="ta-title">¿Olvidaste tu contraseña?</h2>
      <p className="ta-subtitle">Ingresa tu correo y te enviaremos un código de verificación</p>

      {serverErr && <div className="ta-server-error"><i className="bi bi-exclamation-triangle"></i> {serverErr}</div>}

      <div className="ta-form-group">
        <label className="ta-label">Correo electrónico</label>
        <input className={`ta-input ${correoErr ? 'error' : ''}`}
          type="text"
          value={correo}
          onChange={e => { setCorreo(e.target.value); setCorreoErr(validarCorreo(e.target.value)) }}
          onBlur={() => setCorreoErr(validarCorreo(correo))}
          onKeyDown={e => e.key === 'Enter' && sendCode()} />
        <FieldError msg={correoErr} />
      </div>

      <button className="ta-btn-primary" onClick={sendCode} disabled={loading}>
        {loading ? <span className="ta-spinner"></span> : 'Enviar código'}
      </button>

      <button className="ta-btn-ghost" onClick={() => onSwitch('login')}>
        <i className="bi bi-arrow-left"></i> Volver al inicio de sesión
      </button>
    </div>
  )
}

// ═══════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════
export default function TiendaAuth({ onClose, onLoginSuccess }) {
  const [panel, setPanel] = useState('login')
  const [verified, setVerified] = useState(false)

  const handleSuccess = () => {
    if (onLoginSuccess) onLoginSuccess()
    if (onClose) onClose()
    else window.history.back()
  }

  const handleVerified = () => setVerified(true)

  if (verified) return (
    <div className="ta-root">
      <div className="ta-backdrop" onClick={onClose} />
      <div className="ta-panel ta-center">
        <div className="ta-logo">✦ MODA MÁGICA ✦</div>
        <div className="ta-success-icon"><i className="bi bi-check-circle-fill"></i></div>
        <h2 className="ta-title">¡Cuenta verificada!</h2>
        <p className="ta-subtitle">Tu cuenta está activa. Ya puedes iniciar sesión.</p>
        <button className="ta-btn-primary" onClick={() => { setVerified(false); setPanel('login') }}>
          Iniciar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="ta-root">
      <div className="ta-backdrop" onClick={onClose} />
      <div className="ta-container">
        {/* Panel izquierdo decorativo */}
        <div className="ta-deco">
          <div className="ta-deco-inner">
            <div className="ta-deco-logo">✦ MODA MÁGICA ✦</div>
            <h3 className="ta-deco-title">
              {panel === 'login'    && 'Bienvenido de vuelta'}
              {panel === 'register' && 'Únete a nosotros'}
              {panel === 'recovery' && 'Recupera tu acceso'}
            </h3>
            <p className="ta-deco-sub">
              {panel === 'login'    && 'Accede a tu cuenta para disfrutar de la mejor moda.'}
              {panel === 'register' && 'Crea tu cuenta y descubre todo lo que tenemos para ti.'}
              {panel === 'recovery' && 'Te ayudamos a recuperar el acceso a tu cuenta.'}
            </p>
            <div className="ta-deco-features">
              <div className="ta-deco-feat"><i className="bi bi-shield-check"></i> Compra segura</div>
              <div className="ta-deco-feat"><i className="bi bi-bag-heart"></i> Miles de productos</div>
              <div className="ta-deco-feat"><i className="bi bi-headset"></i> Soporte 7/7</div>
            </div>
          </div>
          {/* Olas decorativas */}
          <div className="ta-deco-wave1" />
          <div className="ta-deco-wave2" />
          <div className="ta-deco-wave3" />
        </div>

        {/* Panel derecho — formulario */}
        <div className="ta-form-side">
          {onClose && (
            <button className="ta-close-btn" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
            </button>
          )}
          <div className="ta-form-scroll">
            {panel === 'login'    && <PanelLogin    onSwitch={setPanel} onSuccess={handleSuccess} />}
            {panel === 'register' && <PanelRegistro onSwitch={setPanel} onVerify={handleVerified} />}
            {panel === 'recovery' && <PanelRecovery onSwitch={setPanel} />}
          </div>
        </div>
      </div>
    </div>
  )
}