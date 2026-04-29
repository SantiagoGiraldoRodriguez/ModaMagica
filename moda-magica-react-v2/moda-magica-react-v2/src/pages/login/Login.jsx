import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ADMINS = [
  { id:1, nombre:'Andrea', segundoNombre:'', apellido:'Salcedo', segundoApellido:'', correo:'andrea.salcedo@modamagica.co', numero:'3001112233', fechaRegistro:'05/01/2023', rol:'superadmin', estado:'activo' },
  { id:2, nombre:'Ricardo', segundoNombre:'', apellido:'Fuentes', segundoApellido:'', correo:'rfuentes@modamagica.co', numero:'3123334455', fechaRegistro:'12/03/2023', rol:'admin', estado:'activo' },
  { id:3, nombre:'Paola', segundoNombre:'', apellido:'Jiménez', segundoApellido:'', correo:'pjimenez@modamagica.co', numero:'3205556677', fechaRegistro:'20/06/2023', rol:'editor', estado:'activo' },
  { id:4, nombre:'Felipe', segundoNombre:'', apellido:'Ospina', segundoApellido:'', correo:'fospina@modamagica.co', numero:'3157778899', fechaRegistro:'01/08/2023', rol:'editor', estado:'inactivo' },
  { id:5, nombre:'Natalia', segundoNombre:'', apellido:'Cardona', segundoApellido:'', correo:'ncardona@modamagica.co', numero:'3009990011', fechaRegistro:'14/10/2023', rol:'admin', estado:'activo' },
  { id:6, nombre:'Camilo', segundoNombre:'', apellido:'Restrepo', segundoApellido:'', correo:'crestrepo@modamagica.co', numero:'3181122334', fechaRegistro:'22/01/2024', rol:'editor', estado:'activo' },
]

function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) }

export default function Login({ dark, setDark }) {
  const navigate = useNavigate()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [emailErr, setEmailErr]   = useState('')
  const [pwErr, setPwErr]         = useState('')
  const [generalErr, setGeneralErr] = useState('')

  const validateEmail = (v) => {
    if (!v.trim()) return 'El correo electrónico es obligatorio.'
    if (!isValidEmail(v)) return 'Por favor ingresa un correo electrónico válido.'
    return ''
  }
  const validatePw = (v) => {
    if (!v) return 'La contraseña es obligatoria.'
    if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
    return ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const eErr = validateEmail(email)
    const pErr = validatePw(password)
    setEmailErr(eErr)
    setPwErr(pErr)
    if (eErr || pErr) { setGeneralErr('Por favor corrige los errores antes de continuar.'); return }
    setGeneralErr('')
    const found = ADMINS.find(a => a.correo.toLowerCase() === email.trim().toLowerCase()) || ADMINS[0]
    sessionStorage.setItem('adminSesion', JSON.stringify(found))
    navigate('./dashboard')  // ← este era el bug, antes decía navigate('/')
  }

  return (
    <div className="auth-page">
      <button className="icon-btn" onClick={() => setDark(v => !v)}
        style={{ position:'fixed', top:20, right:20, zIndex:100 }}>
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
            <input
              id="loginEmail"
              type="email"
              className={`form-input${emailErr ? ' input-error' : ''}`}
              placeholder="ejemplo@correo.com"
              value={email}
              autoComplete="email"
              onChange={e => { setEmail(e.target.value); if (isValidEmail(e.target.value)) setEmailErr(''); setGeneralErr('') }}
              onBlur={() => setEmailErr(validateEmail(email))}
            />
            <div className={`error-msg${emailErr ? ' visible' : ''}`}>
              <i className="bi bi-exclamation-circle"></i> {emailErr}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="loginPassword">Contraseña</label>
            <div className="password-wrap">
              <input
                id="loginPassword"
                type={showPwd ? 'text' : 'password'}
                className={`form-input${pwErr ? ' input-error' : ''}`}
                placeholder="Ingresa tu contraseña"
                value={password}
                autoComplete="current-password"
                style={{ paddingRight: 46 }}
                onChange={e => { setPassword(e.target.value); if (e.target.value.length >= 8) setPwErr(''); setGeneralErr('') }}
                onBlur={() => setPwErr(validatePw(password))}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPwd(v => !v)}>
                <i className={`bi bi-eye${showPwd ? '-slash' : ''}`}></i>
              </button>
            </div>
            <div className={`error-msg${pwErr ? ' visible' : ''}`}>
              <i className="bi bi-exclamation-circle"></i> {pwErr}
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
            <a href="/recuperar" className="form-link" style={{ fontSize:13 }}
              onClick={e => { e.preventDefault(); navigate('/recuperar') }}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button type="submit" className="btn-primary auth-btn">
            Iniciar sesión
          </button>

          <div className={`general-error-box${generalErr ? ' visible' : ''}`} style={{ marginTop:12 }}>
            <i className="bi bi-exclamation-triangle"></i> {generalErr}
          </div>

        </form>
      </div>
    </div>
  )
}