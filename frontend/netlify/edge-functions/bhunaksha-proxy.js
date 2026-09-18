export default async (request, context) => {
  const url = new URL(request.url);
  const targetUrl = new URL(url.pathname.replace(/^\/bhunakshaserver/, ''), 'https://upbhunaksha.gov.in');
  targetUrl.search = url.search;

  const headers = new Headers(request.headers);
  headers.set('host', 'upbhunaksha.gov.in');
  headers.set('origin', 'https://upbhunaksha.gov.in');
  headers.set('referer', 'https://upbhunaksha.gov.in/home');
  headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

  const init = {
    method: request.method,
    headers: headers,
    redirect: 'manual'
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  try {
    const response = await fetch(targetUrl.toString(), init);
    return response;
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 502 });
  }
};
