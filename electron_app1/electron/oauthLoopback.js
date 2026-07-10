import http from 'node:http'

export const LOOPBACK_PORT = 54321

/**
 * Starts a one-shot HTTP server on 127.0.0.1:54321 and waits for Supabase to
 * redirect the user's browser to /callback?code=... after Google login.
 * Resolves with the auth code, then shuts the server down.
 */
export function waitForOAuthCallback({ timeoutMs = 5 * 60 * 1000 } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false

    const server = http.createServer((request, response) => {
      const url = new URL(request.url, `http://127.0.0.1:${LOOPBACK_PORT}`)

      if (url.pathname !== '/callback') {
        response.writeHead(404)
        response.end()
        return
      }

      const code = url.searchParams.get('code')
      const errorDescription =
        url.searchParams.get('error_description') ?? url.searchParams.get('error')

      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      response.end(
        '<html><body style="font-family: sans-serif; text-align: center; padding-top: 80px;">' +
          '<h2>로그인 완료</h2><p>이 탭을 닫고 앱으로 돌아가세요.</p>' +
          '</body></html>',
      )

      if (code) {
        finish(() => resolve(code))
      } else {
        finish(() =>
          reject(new Error(errorDescription ?? 'OAuth 콜백에 인증 코드가 없습니다')),
        )
      }
    })

    const timeout = setTimeout(() => {
      finish(() => reject(new Error('Google 로그인 대기 시간이 초과되었습니다')))
    }, timeoutMs)

    function finish(settle) {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timeout)
      server.close()
      settle()
    }

    server.on('error', (error) => {
      finish(() => reject(error))
    })

    server.listen(LOOPBACK_PORT, '127.0.0.1')
  })
}
