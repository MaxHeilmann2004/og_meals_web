import { createServer } from 'node:http'

const verificationCode = 'test-verification-token'
const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1:4174')
  const suppliedCode = request.headers['x-verification-code']

  response.setHeader('content-type', 'application/json')
  response.setHeader('cache-control', 'no-store')

  if (url.pathname === '/verification' && request.method === 'GET') {
    if (suppliedCode === 'backend-unavailable') {
      response.writeHead(503).end(JSON.stringify({ error: 'unavailable' }))
      return
    }

    response.writeHead(200).end(JSON.stringify({
      configured: true,
      authenticated: suppliedCode === verificationCode,
    }))
    return
  }

  if (url.pathname === '/meals' && request.method === 'GET') {
    response.writeHead(suppliedCode === verificationCode ? 200 : 401)
      .end(JSON.stringify({ authenticated: suppliedCode === verificationCode }))
    return
  }

  response.writeHead(404).end(JSON.stringify({ error: 'not found' }))
})

server.listen(4174, '127.0.0.1')
