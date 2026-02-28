export function onRequestGet() {
  return new Response(JSON.stringify({ apiBase: '/api/v1', status: 'ok', version: 'v1' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
