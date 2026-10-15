import { createServer } from 'node:http'

const verificationCodes = new Set(['test-verification-token', '1234567890123'])
const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1:4174')
  const suppliedCode = request.headers['x-verification-code']
  const authenticated = verificationCodes.has(suppliedCode)

  response.setHeader('content-type', 'application/json')
  response.setHeader('cache-control', 'no-store')

  if (url.pathname === '/verification' && request.method === 'GET') {
    if (suppliedCode === 'backend-unavailable') {
      response.writeHead(503).end(JSON.stringify({ error: 'unavailable' }))
      return
    }

    response.writeHead(200).end(JSON.stringify({
      configured: true,
      authenticated,
    }))
    return
  }

  if (url.pathname === '/meals' && request.method === 'GET') {
    response.writeHead(authenticated ? 200 : 401)
      .end(JSON.stringify({ authenticated }))
    return
  }

  response.writeHead(404).end(JSON.stringify({ error: 'not found' }))
})

server.listen(4174, '127.0.0.1')
