import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

const API = `${import.meta.env.VITE_API_URL}/api`

function isValidEmail(v) {
  if ((v.match(/@/g) || []).length > 1) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export default function Login({ dark, setDark }) {
  const navigate = useNavigate()

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPwd,    setShowPwd]    = useState(false)
  const [emailErr,   setEmailErr]   = useState('')
  const [pwErr,      setPwErr]      = useState('')
  const [generalErr, setGeneralErr] = useState('')
  const [loading,    setLoading]    = useState(false)

  const validateEmail = (v) => {
    if (!v.trim())        return 'El correo electrónico es obligatorio.'
    if (!isValidEmail(v)) return 'Por favor ingresa un correo electrónico válido.'
    return ''
  }

  const validatePw = (v) => {
    if (!v)           return 'La contraseña es obligatoria.'
    if (v.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const eErr = validateEmail(email)
    const pErr = validatePw(password)
    setEmailErr(eErr)
    setPwErr(pErr)

    if (eErr || pErr) {
      setGeneralErr('Por favor corrige los errores antes de continuar.')
      return
    }

    setGeneralErr('')
    setLoading(true)

    try {
      const res  = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ correo: email.trim(), contrasena: password })
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 403) { setGeneralErr(data.error); return }
        if (res.status === 401) { setGeneralErr(data.error || 'Correo o contraseña incorrectos.'); return }
        setGeneralErr(data.error || 'Ocurrió un error. Intenta de nuevo.')
        return
      }

      sessionStorage.setItem('adminSesion', JSON.stringify({
        token:           data.token,
        rol:             data.rol === 1 ? 'superadmin' : 'admin',
        nombre:          data.nombre          || '',
        apellido:        data.apellido        || '',
        segundoNombre:   data.segundoNombre   || '',
        segundoApellido: data.segundoApellido || '',
        correo:          data.correo          || '',
        numero:          data.numero          || '',
        estado:          data.estado          || 'activo',
        fechaRegistro:   data.fechaRegistro   || '',
        id:              data.id
      }))

      navigate('/dashboard')

    } catch (err) {
      console.error(err)
      setGeneralErr('No se pudo conectar con el servidor. Verifica que esté corriendo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <button className="icon-btn login-theme-btn" onClick={() => setDark(v => !v)}>
        {dark
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="1.6" d="M12 17a5 5 0 100-10 5 5 0 000 10zM12 3v2M12 19v2M5 12H3M21 12h-2M6.34 6.34l-1.41 1.41M19.07 19.07l-1.41 1.41"/></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="1.6" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        }
      </button>

      <div className="auth-container">
        <span className="auth-logo">✦ Moda Mágica ✦</span>
        <div className="auth-title">Iniciar sesión</div>
        <p className="auth-subtitle">Ingresa a tu panel de administración</p>

        <form onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <label className="form-label" htmlFor="loginEmail">Correo electrónico</label>
            <input id="loginEmail" type="email" className={`form-input${emailErr ? ' input-error' : ''}`} value={email} autoComplete="email"
              onChange={e => { setEmail(e.target.value); if (isValidEmail(e.target.value)) setEmailErr(''); setGeneralErr('') }}
              onBlur={() => setEmailErr(validateEmail(email))} />
            <div className={`error-msg${emailErr ? ' visible' : ''}`}><i className="bi bi-exclamation-circle"></i> {emailErr}</div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="loginPassword">Contraseña</label>
            <div className="password-wrap">
              <input id="loginPassword" type={showPwd ? 'text' : 'password'} className={`form-input login-pwd-input${pwErr ? ' input-error' : ''}`} value={password} autoComplete="current-password"
                onChange={e => { setPassword(e.target.value); if (e.target.value.length >= 6) setPwErr(''); setGeneralErr('') }}
                onBlur={() => setPwErr(validatePw(password))} />
              <button type="button" className="password-toggle" onClick={() => setShowPwd(v => !v)}>
                <i className={`bi bi-eye${showPwd ? '-slash' : ''}`}></i>
              </button>
            </div>
            <div className={`error-msg${pwErr ? ' visible' : ''}`}><i className="bi bi-exclamation-circle"></i> {pwErr}</div>
          </div>

          <div className="login-forgot-row">
            <a href="/recuperar" className="form-link login-forgot-link" onClick={e => { e.preventDefault(); navigate('/recuperar') }}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? 'Verificando...' : 'Iniciar sesión'}
          </button>

          <div className={`general-error-box login-general-error${generalErr ? ' visible' : ''}`}>
            <i className="bi bi-exclamation-triangle"></i> {generalErr}
          </div>

        </form>
      </div>
    </div>
  )
}
