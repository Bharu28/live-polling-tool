const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')
const SESSION_KEY = 'pulsepoll.session'

export function getSession() {
  if (typeof window === 'undefined') return null
  try {
    const value = JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null')
    return value?.token ? value : null
  } catch {
    return null
  }
}

export function setSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event('pulsepoll-session'))
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event('pulsepoll-session'))
}

function objectValue(value) {
  return value && typeof value === 'object' ? value : {}
}

function unwrap(value) {
  const root = objectValue(value)
  return root.data ?? root.result ?? root.poll ?? value
}

function stringValue(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() || ''
}

function numberValue(...values) {
  const value = values.find((item) => typeof item === 'number' || (typeof item === 'string' && item.trim()))
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function normalizePoll(value) {
  const item = objectValue(unwrap(value))
  const rawOptions = item.options ?? item.choices ?? item.answers ?? []
  const options = Array.isArray(rawOptions)
    ? rawOptions.map((option, index) => {
        const row = objectValue(option)
        return {
          id: stringValue(row.id, row._id, row.optionId) || `option-${index + 1}`,
          label: stringValue(row.label, row.text, row.name, row.value) || `Option ${index + 1}`,
          votes: numberValue(row.votes, row.count, row.voteCount),
        }
      })
    : []
  const question = stringValue(item.question, item.title, item.prompt)
  if (!question && !stringValue(item.id, item._id, item.pollId)) return null
  const status = stringValue(item.status, item.state).toLowerCase()
  return {
    id: stringValue(item.id, item._id, item.pollId),
    question: question || 'Untitled poll',
    options,
    totalVotes: numberValue(item.totalVotes, item.voteCount, item.votes, options.reduce((sum, option) => sum + option.votes, 0)),
    status: status === 'ended' || status === 'closed' ? 'ended' : status === 'closing' ? 'closing' : 'live',
    createdAt: stringValue(item.createdAt, item.created_at),
  }
}

async function request(path, init = {}) {
  const session = getSession()
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (session?.token) headers.set('Authorization', `Bearer ${session.token}`)
  const response = await fetch(`${API_URL}${path}`, { ...init, headers })
  const body = await response.text()
  if (body.trimStart().startsWith('<')) {
    throw new Error(`The configured API at ${API_URL} returned HTML instead of JSON. Check VITE_API_URL and the backend port.`)
  }
  let data = null
  try {
    data = body ? JSON.parse(body) : null
  } catch {
    data = body
  }
  if (!response.ok) {
    const error = objectValue(data)
    throw new Error(stringValue(error.message, error.error, body) || `Request failed with status ${response.status}`)
  }
  return data
}

function sessionFromResponse(value, fallbackEmail, fallbackName) {
  const response = objectValue(value)
  const payload = objectValue(unwrap(response))
  const token = stringValue(payload.token, payload.accessToken, payload.jwt, response.token, response.accessToken)
  if (!token) throw new Error('The API did not return a JWT token.')
  const user = objectValue(payload.user ?? response.user)
  return {
    token,
    user: {
      id: stringValue(user.id, user._id),
      email: stringValue(user.email, fallbackEmail),
      name: stringValue(user.name, user.displayName, fallbackName),
    },
  }
}

export async function login(email, password) {
  return sessionFromResponse(await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }), email)
}

export async function signup(input) {
  return sessionFromResponse(await request('/auth/signup', { method: 'POST', body: JSON.stringify(input) }), input.email, input.name)
}

export async function getMyVote(pollId) {
  try {
    const response = await request(`/polls/${encodeURIComponent(pollId)}/my-vote`)
    return {
      hasVoted: Boolean(response?.hasVoted),
      optionId: response?.optionId || null,
    }
  } catch (error) {
    if (error instanceof Error && /status 404|404 page not found|Authentication required|Unauthorized/i.test(error.message)) {
      return { hasVoted: false, optionId: null }
    }
    throw error
  }
}

export async function listPolls() {
  const response = await request('/polls')
  const root = objectValue(response)
  const values = Array.isArray(response) ? response : root.polls ?? root.items ?? root.data ?? root.results ?? []
  return Array.isArray(values) ? values.map(normalizePoll).filter(Boolean) : []
}

export async function getPoll(id) {
  const poll = normalizePoll(await request(`/polls/${encodeURIComponent(id)}`))
  if (!poll) throw new Error('The API returned an unreadable poll.')
  return poll
}

export async function createPoll(question, options) {
  const poll = normalizePoll(await request('/polls', { method: 'POST', body: JSON.stringify({ question, options }) }))
  if (!poll) throw new Error('The API did not return the created poll.')
  return poll
}

export async function vote(pollId, optionId) {
  const poll = normalizePoll(await request(`/polls/${encodeURIComponent(pollId)}/vote`, { method: 'POST', body: JSON.stringify({ optionId }) }))
  return poll
}

export function getStreamUrl(id) {
  return `${API_URL}/polls/${encodeURIComponent(id)}/stream`
}

export function getApiUrl() {
  return API_URL
}
