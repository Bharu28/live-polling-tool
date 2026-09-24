import { useState } from 'react'
import { Link } from 'react-router-dom'

const demoOptions = [
  { label: 'Java', value: 48, tone: 'violet' },
  { label: 'Python', value: 27, tone: 'mint' },
  { label: 'React', value: 15, tone: 'lavender' },
  { label: 'Go', value: 10, tone: 'blue' },
]

export function ImmersiveHero() {
  const [active, setActive] = useState('Java')

  return <section className="immersive-hero" data-reveal="hero">
    <div className="aurora aurora-violet" />
    <div className="aurora aurora-mint" />
    <div className="hero-copy immersive-copy">
      <p className="eyebrow"><span className="live-dot" /> REAL-TIME POLLING PLATFORM</p>
      <h1>Every voice deserves <span>to be heard.</span></h1>
      <p className="hero-text">Create a poll. Share it anywhere. Watch every vote come alive in real time.</p>
      <div className="hero-actions"><Link to="/create-poll" className="button button-primary">Create a Poll <span>→</span></Link><a href="#signals" className="button button-secondary">Explore Live Polls</a></div>
      <div className="hero-proof"><span><strong>01</strong> question to launch</span><span><strong>∞</strong> voices in the room</span><span><strong>LIVE</strong> results as they land</span></div>
    </div>
    <div className="hero-stage" aria-label="Interactive live poll demonstration">
      <div className="orb-halo orb-halo-one" /><div className="orb-halo orb-halo-two" /><div className="opinion-orb"><div className="orb-core"><span className="orb-pulse" /><span className="orb-number">48<span>%</span></span><span className="orb-caption">leading signal</span></div><span className="orb-node node-one" /><span className="orb-node node-two" /><span className="orb-node node-three" /><span className="orb-node node-four" /></div>
      <div className="floating-chip chip-live"><span className="live-dot" /> LIVE NOW</div><div className="floating-chip chip-count">1,248 <span>voices</span></div>
      <div className="hero-poll-card"><div className="poll-card-top"><span className="status-badge status-live"><span className="live-dot" /> LIVE</span><span className="mono">PULSE / 0427</span></div><h3>What should we learn next?</h3><p>Tap a signal to preview the room.</p><div className="hero-results">{demoOptions.map((option) => <button key={option.label} className={`hero-result ${active === option.label ? 'is-leading' : ''}`} onClick={() => setActive(option.label)}><div className="option-meta"><span>{option.label}</span><strong>{option.value}%</strong></div><span className={`progress-track tone-${option.tone}`}><span style={{ width: `${option.value}%` }} /></span></button>)}</div><div className="hero-card-foot"><span>Every vote shifts the signal</span><span className="signal-line" /></div></div>
    </div>
  </section>
}

export function PollStory() {
  return <section className="poll-story" data-reveal><div className="story-intro"><p className="eyebrow">THE PULSE OF A ROOM</p><h2>One question can start a conversation.</h2><p>PulsePoll turns a quiet room into a visible signal. Ask clearly, invite everyone, and let the result take shape in public.</p></div><div className="story-rail"><div className="story-card story-question"><span className="story-index">01 / ASK</span><strong>Question</strong><span className="story-symbol">?</span></div><div className="story-arrow">→</div><div className="story-card story-votes"><span className="story-index">02 / LISTEN</span><strong>Votes</strong><div className="story-dots"><i /><i /><i /><i /><i /></div></div><div className="story-arrow">→</div><div className="story-card story-result"><span className="story-index">03 / SEE</span><strong>Live result</strong><span className="story-bar" /></div></div></section>
}
