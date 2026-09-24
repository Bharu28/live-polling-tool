import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { clearSession, createPoll, getApiUrl, getMyVote, getPoll, getSession, getStreamUrl, listPolls, login, normalizePoll, setSession, signup, vote } from './api'
import { ImmersiveHero, PollStory } from './ImmersiveHero'

const navItems = [
  { label: 'Home', path: '/', icon: '⌂' },
  { label: 'Dashboard', path: '/dashboard', icon: '▦' },
  { label: 'My Polls', path: '/polls', icon: '☷' },
  { label: 'Live Polls', path: '/live-polls', icon: '◉' },
]

function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<PublicLayout />}><Route index element={<HomePage />} /><Route path="login" element={<AuthPage mode="login" />} /><Route path="signup" element={<AuthPage mode="signup" />} /></Route>
    <Route element={<ProtectedLayout />}><Route path="dashboard" element={<DashboardPage />} /><Route path="create-poll" element={<CreatePollPage />} /><Route path="polls/create" element={<CreatePollPage />} /><Route path="polls" element={<PollsPage />} /><Route path="live-polls" element={<LivePollsPage />} /><Route path="profile" element={<ProfilePage />} /><Route path="settings" element={<SettingsPage />} /></Route>
    <Route path="/poll/:id" element={<PublicPollPage />} /><Route path="/poll/:id/results" element={<ResultsPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></BrowserRouter>
}

function PublicLayout() {
  const session = usePersistentSession()
  return <div className="public-shell"><header className="site-header"><Link to="/" className="brand"><span className="brand-mark">P</span>PulsePoll</Link><nav className="header-nav" aria-label="Primary"><a href="/#product">Product</a><a href="/#signals">Signals</a><a href="/#workflow">Workflow</a></nav><div className="header-actions">{session ? <Link to="/dashboard" className="header-login">Dashboard</Link> : <><Link to="/login" className="header-login">Login</Link><Link to="/signup" className="button button-primary button-small">Create a poll</Link></>}</div></header><Outlet /></div>
}

function ProtectedLayout() {
  const location = useLocation()
  const session = usePersistentSession()
  if (session === undefined) return <AuthLoadingState />
  if (!session) {
    if (location.pathname === '/create-poll') return <AuthRequiredPage />
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />
  }
  return <div className="app-frame"><Sidebar /><main className="app-main"><div className="mobile-topbar"><SidebarToggle /><Link to="/" className="brand"><span className="brand-mark">P</span>PulsePoll</Link></div><Outlet /></main></div>
}

function usePersistentSession() {
  const [session, setSessionState] = useState(undefined)
  useEffect(() => {
    const update = () => setSessionState(getSession())
    update()
    window.addEventListener('pulsepoll-session', update)
    return () => window.removeEventListener('pulsepoll-session', update)
  }, [])
  return session
}

function AuthLoadingState() {
  return <div className="public-state"><Link to="/" className="brand"><span className="brand-mark">P</span>PulsePoll</Link><div className="state-card"><h1>Checking session…</h1></div></div>
}

function AuthRequiredPage() {
  const returnTo = encodeURIComponent('/create-poll')
  return <div className="auth-required-page"><div className="auth-required-glow" /><div className="auth-required-panel"><Link to="/" className="brand"><span className="brand-mark">P</span>PulsePoll</Link><p className="eyebrow">READY WHEN YOU ARE</p><h1>Login or create an account to create a poll.</h1><p className="muted">Your polls belong to your workspace. Sign in to launch a question and keep its live results in one place.</p><div className="auth-required-actions"><Link to={`/login?returnTo=${returnTo}`} className="button button-primary">Login</Link><Link to={`/signup?returnTo=${returnTo}`} className="button button-secondary">Create Account</Link></div><Link to="/" className="back-link">← Back to Home</Link></div></div>
}

function Sidebar() {
  const location = useLocation(); const navigate = useNavigate(); const [open, setOpen] = useState(false); const [collapsed, setCollapsed] = useState(false)
  useEffect(() => { const close = (event) => event.key === 'Escape' && setOpen(false); window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [])
  const logout = () => { clearSession(); navigate('/login', { replace: true }) }
  return <><button className={`sidebar-overlay ${open ? 'is-visible' : ''}`} aria-label="Close navigation" onClick={() => setOpen(false)} /><aside className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${open ? 'is-open' : ''}`}><div className="sidebar-head"><Link to="/" className="brand"><span className="brand-mark">P</span>{!collapsed && 'PulsePoll'}</Link><button className="icon-button sidebar-collapse" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}>{collapsed ? '→' : '←'}</button></div><p className="sidebar-label">{!collapsed && 'MENU'}</p><nav className="sidebar-nav" aria-label="App navigation">{navItems.map((item) => <NavItem key={item.path} item={item} active={location.pathname === item.path} collapsed={collapsed} onClick={() => setOpen(false)} />)}</nav><div className="sidebar-rule" /><nav className="sidebar-nav"><NavItem item={{ label: 'Profile', path: '/profile', icon: '◎' }} active={location.pathname === '/profile'} collapsed={collapsed} onClick={() => setOpen(false)} /><NavItem item={{ label: 'Settings', path: '/settings', icon: '⚙' }} active={location.pathname === '/settings'} collapsed={collapsed} onClick={() => setOpen(false)} /></nav><div className="sidebar-rule" /><button className="sidebar-link" onClick={logout} title={collapsed ? 'Logout' : undefined}><span className="sidebar-icon">↪</span>{!collapsed && 'Logout'}</button><button className="mobile-close icon-button" onClick={() => setOpen(false)} aria-label="Close navigation">×</button></aside><button className="mobile-menu-button" onClick={() => setOpen(true)} aria-label="Open navigation">☰</button></>
}

function SidebarToggle() { return null }
function NavItem({ item, active, collapsed, onClick }) { return <Link to={item.path} onClick={onClick} className={`sidebar-link ${active ? 'is-active' : ''}`} title={collapsed ? item.label : undefined}><span className="sidebar-icon">{item.icon}</span>{!collapsed && item.label}</Link> }

function HomePage() {
  useRevealSections()
  return <><ImmersiveHero /><PollStory /><section id="product" className="product-strip" data-reveal><div><p className="eyebrow">ONE CLEAR FLOW</p><h2>From question to signal in seconds.</h2></div><div className="flow-steps"><FlowStep number="01" title="Create" text="Ask a focused question." /><FlowStep number="02" title="Share" text="Send one simple link." /><FlowStep number="03" title="Vote" text="Let the room respond." /><FlowStep number="04" title="Live results" text="Watch the signal move." /></div></section><section id="signals" className="home-section signal-section" data-reveal><div><p className="eyebrow">THE SIGNAL</p><h2>Make the room visible.</h2><p>PulsePoll gives every audience a clear way to speak, and every host a live view of where the room is landing.</p></div><div className="signal-visual"><span className="signal-ring ring-one" /><span className="signal-ring ring-two" /><strong>LIVE</strong><span>the room is moving</span></div></section><section id="workflow" className="home-section workflow-section" data-reveal><p className="eyebrow">HOW IT WORKS</p><h2>Simple enough for the moment.</h2><div className="feature-grid"><Feature title="No setup drag" text="Create a poll with a question and a few clear choices." icon="✦" /><Feature title="One link to share" text="Invite the room with a URL that works on every device." icon="↗" /><Feature title="Live by default" text="Results update as votes arrive, without manual refreshes." icon="◉" /></div></section><footer className="site-footer"><Link to="/" className="brand"><span className="brand-mark">P</span>PulsePoll</Link><span>Create · Share · Vote · Live results</span></footer></>
}

function useRevealSections() { useEffect(() => { const elements = document.querySelectorAll('[data-reveal]'); if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { elements.forEach((element) => element.classList.add('is-visible')); return undefined } const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')), { threshold: .12 }); elements.forEach((element) => observer.observe(element)); return () => observer.disconnect() }, []) }
function PollPreview({ options }) { return <div className="poll-preview"><div className="preview-head"><span className="status-badge"><span className="live-dot" /> LIVE POLL</span><span className="mono">1,248 votes</span></div><h3>When should we launch?</h3><p className="preview-subtitle">The room is voting now.</p><div className="preview-options">{options.map((option, index) => <div className="preview-option" key={`${option.label}-${index}`}><div className="option-meta"><span>{option.label}</span><span>{option.votes}%</span></div><div className="progress-track"><span style={{ width: `${option.votes}%` }} /></div></div>)}</div><div className="preview-foot"><span className="live-dot" /> Updating live</div></div> }
function FlowStep({ number, title, text }) { return <div className="flow-step"><span className="step-number">{number}</span><strong>{title}</strong><p>{text}</p></div> }
function Feature({ title, text, icon }) { return <article className="feature"><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{text}</p></article> }

function AuthPage({ mode }) {
  const navigate = useNavigate(); const location = useLocation(); const session = usePersistentSession(); const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' }); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  useEffect(() => { if (session) navigate('/dashboard', { replace: true }) }, [navigate, session])
  if (session === undefined) return <AuthLoadingState />
  const authQuery = location.search || ''
  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  const submit = async (event) => { event.preventDefault(); setError(''); if (!values.email.includes('@') || values.password.length < 8) return setError('Use a valid email and a password with at least 8 characters.'); if (mode === 'signup' && (!values.name.trim() || values.password !== values.confirm)) return setError(values.name.trim() ? 'Passwords do not match.' : 'Add your name to continue.'); setLoading(true); try { const session = mode === 'login' ? await login(values.email.trim(), values.password) : await signup({ name: values.name.trim(), email: values.email.trim(), password: values.password }); setSession(session); const returnTo = new URLSearchParams(location.search).get('returnTo'); navigate(returnTo?.startsWith('/') ? returnTo : '/dashboard') } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to connect to the API.') } finally { setLoading(false) } }
  return <div className="auth-page"><div className="auth-panel"><Link to="/" className="brand"><span className="brand-mark">P</span>PulsePoll</Link><p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'CREATE YOUR WORKSPACE'}</p><h1>{mode === 'login' ? 'Return to the room.' : 'Start a live pulse.'}</h1><p className="muted">{mode === 'login' ? 'Sign in to manage your polls and read the room.' : 'Build a question, share the link, and see what your audience thinks.'}</p><form onSubmit={submit} className="form-stack">{mode === 'signup' && <Field label="Name"><input value={values.name} onChange={update('name')} autoComplete="name" placeholder="Alex Morgan" /></Field>}<Field label="Email"><input value={values.email} onChange={update('email')} type="email" autoComplete="email" placeholder="you@company.com" /></Field><Field label="Password"><input value={values.password} onChange={update('password')} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" /></Field>{mode === 'signup' && <Field label="Confirm password"><input value={values.confirm} onChange={update('confirm')} type="password" autoComplete="new-password" placeholder="Repeat your password" /></Field>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary button-wide" disabled={loading}>{loading ? 'Connecting…' : mode === 'login' ? 'Login' : 'Create Account'}</button></form><div className="auth-links">{mode === 'login' ? <span>Need an account? <Link to={`/signup${authQuery}`}>Create Account</Link></span> : <span>Already have an account? <Link to={`/login${authQuery}`}>Login</Link></span>}<Link to="/">Back to Home</Link></div></div></div>
}
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label> }

function DashboardPage() { const { polls, loading, error } = usePolls(); const session = getSession(); const active = polls.filter((poll) => poll.status === 'live'); const votes = polls.reduce((total, poll) => total + poll.totalVotes, 0); return <Page title={`Good signal, ${session?.user?.name?.split(' ')[0] || 'operator'}.`} eyebrow="DASHBOARD" action={<Link to="/create-poll" className="button button-primary">+ Create Poll</Link>}>{error && <ErrorNotice message={error} />}{loading ? <SkeletonList /> : <><div className="metric-grid"><Metric label="Total polls" value={polls.length} /><Metric label="Total votes" value={votes.toLocaleString()} /><Metric label="Active polls" value={active.length} accent /></div><section className="content-section"><div className="section-heading"><div><p className="eyebrow">YOUR POLLS</p><h2>Recent activity</h2></div><Link to="/polls" className="text-link">View all →</Link></div>{polls.length ? <PollGrid polls={polls.slice(0, 4)} /> : <EmptyState title="No polls yet" text="Create your first live question and invite the room." action={<Link to="/create-poll" className="button button-primary">Create a Poll</Link>} />}</section></>}</Page> }
function Metric({ label, value, accent }) { return <div className="metric"><span>{label}</span><strong className={accent ? 'mint-text' : ''}>{value}</strong></div> }
function Page({ title, eyebrow, action, children }) { return <div className="page-content"><div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>{action}</div>{children}</div> }
function ErrorNotice({ message }) { return <div className="error-notice" role="alert">{message}</div> }
function SkeletonList() { return <div className="skeleton-list"><span /><span /><span /></div> }
function EmptyState({ title, text, action }) { return <div className="empty-state"><span className="empty-mark">◌</span><h3>{title}</h3><p>{text}</p>{action}</div> }

function PollsPage() { const { polls, loading, error } = usePolls(); const [query, setQuery] = useState(''); const [status, setStatus] = useState('all'); const filtered = polls.filter((poll) => poll.question.toLowerCase().includes(query.toLowerCase()) && (status === 'all' || poll.status === status)); return <Page title="My polls" eyebrow="POLL LIBRARY" action={<Link to="/create-poll" className="button button-primary">+ Create Poll</Link>}><BackLink to="/dashboard">Back to Dashboard</BackLink><div className="filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search polls" aria-label="Search polls" /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="live">Live</option><option value="ended">Ended</option></select></div>{error && <ErrorNotice message={error} />}{loading ? <SkeletonList /> : filtered.length ? <PollGrid polls={filtered} /> : <EmptyState title="No matching polls" text={polls.length ? 'Try a different search or status filter.' : 'Your created polls will appear here.'} action={<Link to="/create-poll" className="button button-primary">Create a Poll</Link>} />}</Page> }
function LivePollsPage() { const { polls, loading, error } = usePolls(); const live = polls.filter((poll) => poll.status === 'live'); return <Page title="Live polls" eyebrow="OPEN NOW"><BackLink to="/dashboard">Back to Dashboard</BackLink>{error && <ErrorNotice message={error} />}{loading ? <SkeletonList /> : live.length ? <PollGrid polls={live} liveOnly /> : <EmptyState title="Nothing live right now" text="Active polls will appear here as they open." action={<Link to="/create-poll" className="button button-primary">Create a Poll</Link>} />}</Page> }
function PollGrid({ polls, liveOnly }) { const [sharePoll, setSharePoll] = useState(null); return <><div className="poll-grid">{polls.map((poll) => <PollCard key={poll.id} poll={poll} liveOnly={liveOnly} onShare={() => setSharePoll(poll)} />)}</div>{sharePoll && <ShareModal poll={sharePoll} onClose={() => setSharePoll(null)} />}</> }
function PollCard({ poll, liveOnly, onShare }) { return <article className="poll-card"><div className="poll-card-top"><span className={`status-badge ${poll.status === 'live' ? 'status-live' : 'status-ended'}`}>{poll.status === 'live' && <span className="live-dot" />}{poll.status.toUpperCase()}</span><span className="mono">{poll.totalVotes.toLocaleString()} votes</span></div><h3>{poll.question}</h3><p className="poll-date">{formatDate(poll.createdAt)}</p><div className="card-actions"><Link to={`/poll/${poll.id}`} className="text-link">View</Link><Link to={`/poll/${poll.id}/results`} className="text-link">Results</Link>{!liveOnly && <button className="text-link button-reset" onClick={onShare}>Share</button>}</div></article> }

function CreatePollPage() { const [question, setQuestion] = useState(''); const [options, setOptions] = useState(['', '']); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [created, setCreated] = useState(null); const updateOption = (index, value) => setOptions((items) => items.map((item, current) => current === index ? value : item)); const submit = async (event) => { event.preventDefault(); const clean = options.map((item) => item.trim()); if (question.trim().length < 8) return setError('Write a question with at least 8 characters.'); if (clean.some((item) => !item)) return setError('Every option needs a response.'); if (new Set(clean.map((item) => item.toLowerCase())).size !== clean.length) return setError('Options must be unique.'); setError(''); setLoading(true); try { const poll = await createPoll(question.trim(), clean); setCreated(poll) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to create the poll.') } finally { setLoading(false) } }; return <Page title="Create a poll" eyebrow="NEW POLL"><BackLink to="/dashboard">Back to Dashboard</BackLink><div className="create-layout"><form onSubmit={submit} className="panel form-stack"><Field label="Question"><textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={180} rows="4" placeholder="What should the room decide today?" /></Field><div className="options-heading"><div><span className="field-label">Answer options</span><p className="muted small">Add between 2 and 6 clear choices.</p></div><span className="mono">{options.length}/6</span></div>{options.map((option, index) => <div className="option-input" key={index}><span>{String(index + 1).padStart(2, '0')}</span><input value={option} onChange={(event) => updateOption(index, event.target.value)} maxLength={80} placeholder={`Option ${index + 1}`} />{options.length > 2 && <button type="button" className="icon-button" onClick={() => setOptions((items) => items.filter((_, current) => current !== index))}>×</button>}</div>)}<button type="button" className="button button-secondary" onClick={() => setOptions((items) => items.length >= 6 ? items : [...items, ''])}>Add option</button>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary button-wide" disabled={loading}>{loading ? 'Creating…' : 'Create Poll'}</button>{created && <Link className="button button-secondary button-wide" to={`/poll/${created.id}`}>Open Poll</Link>}</form></div></Page> }

function ShareModal({ poll, onClose }) { const [copied, setCopied] = useState(false); const url = `${window.location.origin}/poll/${poll.id}`; const copy = async () => { await navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800) }; const share = async () => { if (navigator.share) await navigator.share({ title: poll.question, url }); else await copy() }; return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="share-title"><button className="modal-close icon-button" onClick={onClose} aria-label="Close">×</button><p className="eyebrow">POLL READY</p><h2 id="share-title">Poll Created Successfully</h2><p className="muted">Your question is ready for the room.</p><div className="share-url">{url}</div><div className="modal-actions"><button className="button button-secondary" onClick={copy}>{copied ? 'Copied!' : 'Copy Link'}</button><button className="button button-secondary" onClick={share}>Share</button><Link className="button button-primary" to={`/poll/${poll.id}`} onClick={onClose}>Open Poll</Link></div></div></div> }

function PublicPollPage() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null)
  const [selected, setSelected] = useState('')
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [pollData, voteData] = await Promise.all([
          getPoll(id),
          getSession()?.token ? getMyVote(id) : Promise.resolve({ hasVoted: false, optionId: null }),
        ])

        if (!active) return
        setPoll(pollData)
        setHasVoted(Boolean(voteData?.hasVoted))
        setSelected(voteData?.optionId || '')
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load poll.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [id])

  const submit = async () => {
    if (!selected || hasVoted) return
    try {
      const updated = await vote(id, selected)
      if (updated) setPoll(updated)
      setHasVoted(true)
      setSelected(selected)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to submit vote.'
      if (/already voted/i.test(message)) {
        setHasVoted(true)
        return
      }
      setError(message)
    }
  }

  if (loading) return <PublicState text="Loading poll…" />
  if (error || !poll) return <PublicState text={error || 'This poll is unavailable.'} error />

  return <div className="public-poll-page"><div className="public-poll-head"><Link to="/" className="brand"><span className="brand-mark">P</span>PulsePoll</Link><span className="status-badge status-live"><span className="live-dot" /> {poll.status === 'live' ? 'LIVE' : 'CLOSED'}</span></div><div className="public-poll-card"><BackLink to="/polls">Back to My Polls</BackLink><p className="eyebrow">{hasVoted ? 'VOTE RECORDED' : 'YOUR VOICE MATTERS'}</p><h1>{poll.question}</h1>{hasVoted ? <div className="vote-success"><span>✓</span><h2>You have already voted</h2><p className="muted">Your vote is locked for this poll. Results continue updating in real time.</p><Link to={`/poll/${id}/results`} className="button button-primary">View Live Results</Link></div> : <><div className="vote-options">{poll.options.map((option) => <button key={option.id} className={`vote-option ${selected === option.id ? 'is-selected' : ''}`} onClick={() => setSelected(option.id)} disabled={hasVoted}><span className="radio-dot" /><span>{option.label}</span></button>)}</div><button className="button button-primary button-wide" disabled={!selected || poll.status !== 'live' || hasVoted} onClick={submit}>Vote</button></>}</div></div> }

function ResultsPage() { const { id } = useParams(); const [poll, setPoll] = useState(null); const [state, setState] = useState('connecting'); const [error, setError] = useState(''); useEffect(() => { let active = true; getPoll(id).then((value) => active && setPoll(value)).catch((caught) => active && setError(caught.message)); const source = new EventSource(getStreamUrl(id)); source.onopen = () => active && setState('connected'); source.onmessage = (event) => { try { const next = normalizePoll(JSON.parse(event.data)); if (active && next) setPoll(next) } catch { /* Ignore malformed server events. */ } }; source.onerror = () => active && setState('error'); return () => { active = false; source.close() } }, [id]); if (error && !poll) return <PublicState text={error} error />; return <div className="public-poll-page"><div className="public-poll-head"><Link to="/" className="brand"><span className="brand-mark">P</span>PulsePoll</Link><span className={`status-badge ${state === 'connected' ? 'status-live' : 'status-ended'}`}><span className="live-dot" /> {state === 'connected' ? 'CONNECTED' : state === 'error' ? 'CONNECTION ERROR' : 'CONNECTING'}</span></div>{poll ? <div className="results-card"><BackLink to={`/poll/${id}`}>Back to Poll</BackLink><p className="eyebrow">LIVE RESULTS</p><h1>{poll.question}</h1><div className="results-total"><strong>{poll.totalVotes.toLocaleString()}</strong><span>Total votes</span></div><div className="result-list">{poll.options.map((option) => { const percentage = poll.totalVotes ? Math.round((option.votes / poll.totalVotes) * 100) : 0; return <div className="result-row" key={option.id}><div className="option-meta"><span>{option.label}</span><strong>{option.votes} · {percentage}%</strong></div><div className="progress-track"><span style={{ width: `${percentage}%` }} /></div></div> })}</div></div> : <PublicState text="Loading results…" />}</div> }
function PublicState({ text, error }) { return <div className="public-state"><Link to="/" className="brand"><span className="brand-mark">P</span>PulsePoll</Link><div className={`state-card ${error ? 'has-error' : ''}`}><h1>{error ? 'Poll unavailable' : text}</h1>{error && <p className="muted">{text}</p>}<Link to="/" className="button button-primary">Go Home</Link></div></div> }

function ProfilePage() { const session = getSession(); return <Page title="Profile" eyebrow="ACCOUNT"><BackLink to="/dashboard">Back to Dashboard</BackLink><div className="panel account-panel"><div className="profile-avatar">{(session?.user?.name || session?.user?.email || 'P')[0].toUpperCase()}</div><div><p className="eyebrow">ACCOUNT INFORMATION</p><h2>{session?.user?.name || 'PulsePoll member'}</h2><p className="muted">{session?.user?.email}</p></div></div></Page> }
function SettingsPage() { return <Page title="Settings" eyebrow="PREFERENCES"><BackLink to="/dashboard">Back to Dashboard</BackLink><div className="settings-list"><div className="setting-row"><div><strong>Appearance</strong><p className="muted">Use the PulsePoll midnight theme.</p></div><span className="setting-value">Midnight</span></div><div className="setting-row"><div><strong>Notifications</strong><p className="muted">Live updates are delivered on poll pages.</p></div><span className="setting-value">Live</span></div><div className="setting-row"><div><strong>API connection</strong><p className="muted">Requests are sent to the configured backend.</p></div><span className="setting-value mono">{getApiUrl()}</span></div></div></Page> }
function BackLink({ to, children }) { return <Link className="back-link" to={to}>← {children}</Link> }
function usePolls() { const [polls, setPolls] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); useEffect(() => { let active = true; listPolls().then((value) => active && setPolls(value)).catch((caught) => active && setError(caught.message)).finally(() => active && setLoading(false)); return () => { active = false } }, []); return { polls, loading, error } }
function formatDate(value) { if (!value) return 'Date unavailable'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) }
function NotFoundPage() { return <div className="not-found"><span className="eyebrow">PULSE POLL</span><h1>404</h1><p>Page not found.</p><Link to="/" className="button button-primary">Go Home</Link></div> }

export default App
