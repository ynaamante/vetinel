import { useState } from 'react';
import { USERS } from '../data/mockData';
import { Icons } from '../icons';

export default function LoginPage({ onLogin }) {
  const [email, setEmail]   = useState('');
  const [pw, setPw]         = useState('');
  const [show, setShow]     = useState(false);
  const [err, setErr]       = useState('');

  function submit(e) {
    e.preventDefault();
    const user = USERS.find(u => u.email === email && u.password === pw);
    if (user) { setErr(''); onLogin(user); }
    else setErr('Incorrect email or password.');
  }

  return (
    <div style={s.wrap}>

      {/* LEFT */}
      <div style={s.left}>
        <div>
          <div style={s.brand}>VetIntel</div>
          <div style={s.brandTag}>Disease Intelligence Network</div>
        </div>

        <div style={s.features}>
          {[
            { n: '01', title: 'Multi-clinic network',       body: 'connects your practice with peer clinics for shared disease intelligence' },
            { n: '02', title: 'Privacy-first architecture', body: 'patient records never leave your clinic node' },
            { n: '03', title: 'Early outbreak detection',   body: 'threshold-based alerts before issues become critical' },
          ].map(f => (
            <div key={f.n} style={s.feat}>
              <div style={s.featNum}>{f.n}</div>
              <div style={s.featText}>
                <strong style={{ color: '#cbd5e0', fontWeight: 500 }}>{f.title}</strong>
                {' — '}{f.body}
              </div>
            </div>
          ))}
        </div>

        <div style={s.trusted}>
          <div style={s.dots}>
            <span style={{ ...s.dot, background: '#1d4ed8' }} />
            <span style={{ ...s.dot, background: '#3b82f6', opacity: .7 }} />
            <span style={{ ...s.dot, background: '#93c5fd', opacity: .5 }} />
          </div>
          Trusted by 6 connected clinics
        </div>
      </div>

      {/* RIGHT */}
      <div style={s.right}>
        <div style={s.formWrap}>
          <h2 style={s.heading}>Welcome back</h2>
          <p style={s.sub}>Sign in to your clinic node</p>

          <form onSubmit={submit}>
            <div style={s.fieldWrap}>
              <label style={s.label}>Email address</label>
              <input
                style={s.input}
                type="email"
                placeholder="you@clinic.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={s.fieldWrap}>
              <label style={s.label}>Password</label>
              <div style={s.pwGroup}>
                <input
                  style={{ ...s.input, paddingRight: 42 }}
                  type={show ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  required
                />
                <button
                  type="button"
                  style={s.eyeBtn}
                  onClick={() => setShow(v => !v)}
                >
                  <span style={{ width: 16, height: 16, display: 'flex', color: '#94a3b8' }}>
                    {show ? Icons.eyeOff : Icons.eye}
                  </span>
                </button>
              </div>
            </div>

            <div style={s.forgotRow}>
              <a href="#" style={s.forgotLink}>Forgot password?</a>
            </div>

            <button type="submit" style={s.btnPrimary}>Sign in</button>
            {err && <p style={s.err}>{err}</p>}
          </form>
        </div>
      </div>

    </div>
  );
}

const s = {
  wrap:     { display: 'flex', height: '100vh' },
  left: {
    width: '44%',
    background: '#0f1117',
    padding: '64px 56px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-.02em',
  },
  brandTag: {
    fontSize: '.72rem',
    color: '#475569',
    marginTop: 4,
    letterSpacing: '.04em',
    textTransform: 'uppercase',
    fontWeight: 500,
  },
  features: { marginTop: 'auto', marginBottom: 'auto' },
  feat: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 24,
  },
  featNum: {
    width: 26, height: 26,
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '.7rem', fontWeight: 600, color: '#64748b',
    flexShrink: 0, marginTop: 1,
  },
  featText: { fontSize: '.85rem', color: '#94a3b8', lineHeight: 1.5 },
  trusted: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: '.75rem',
    color: '#334155',
  },
  dots: { display: 'flex', gap: 4 },
  dot:  { width: 6, height: 6, borderRadius: '50%', display: 'inline-block' },
  right: {
    flex: 1,
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formWrap: { width: 360 },
  heading: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '1.6rem',
    fontWeight: 600,
    color: '#0f1117',
    letterSpacing: '-.02em',
    marginBottom: 4,
  },
  sub: { fontSize: '.83rem', color: '#64748b', marginBottom: 36 },
  fieldWrap: { marginBottom: 18 },
  label: {
    display: 'block',
    fontSize: '.78rem',
    fontWeight: 500,
    color: '#0f1117',
    marginBottom: 6,
    letterSpacing: '.01em',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #e8ecf0',
    borderRadius: 10,
    fontSize: '.88rem',
    color: '#0f1117',
    background: '#fafbfc',
    outline: 'none',
  },
  pwGroup: { position: 'relative' },
  eyeBtn: {
    position: 'absolute',
    right: 12, top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center',
  },
  forgotRow: { textAlign: 'right', marginTop: -10, marginBottom: 22 },
  forgotLink: { fontSize: '.78rem', color: '#1d4ed8', textDecoration: 'none' },
  btnPrimary: {
    width: '100%', padding: 11,
    background: '#0f1117', color: '#fff',
    border: 'none', borderRadius: 10,
    fontSize: '.88rem', fontWeight: 500,
    letterSpacing: '.01em', cursor: 'pointer',
  },
  err: { fontSize: '.78rem', color: '#dc2626', textAlign: 'center', marginTop: 12 },
};