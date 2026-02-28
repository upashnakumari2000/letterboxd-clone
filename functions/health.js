export function onRequestGet() {
  return new Response(JSON.stringify({ service: 'frontend-functions', status: 'ok' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
