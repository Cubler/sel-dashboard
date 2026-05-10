export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization') ?? ''

  if (!authHeader.startsWith('Basic ')) {
    throw createError({
      statusCode: 401,
      data: { title: 'Unauthorized', status: 401, detail: 'Missing Basic credentials' },
    })
  }

  const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8')
  const colonIdx = decoded.indexOf(':')
  const username = decoded.slice(0, colonIdx)
  const password = decoded.slice(colonIdx + 1)

  if (username === 'testuser' && password === 'testpass') {
    return {
      AccessToken: `mock-bearer-${Date.now()}`,
      ExpiresIn: 3600,
      Scope: 'api',
      TokenType: 'Bearer',
    }
  }

  throw createError({
    statusCode: 401,
    data: { title: 'Unauthorized', status: 401, detail: 'Invalid credentials' },
  })
})
