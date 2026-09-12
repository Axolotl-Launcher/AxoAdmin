// Node fetch transparently decompresses gzip/br bodies but leaves the
// `content-encoding` header in place. Forwarding it verbatim makes browsers
// fail with ERR_CONTENT_DECODING_FAILED. Drop it (and the stale compressed
// content-length) and let the response body travel as-is.
export function passthrough(response: Response): Response {
  const headers = new Headers();
  for (const [key, value] of response.headers) {
    if (key === "content-encoding" || key === "content-length") continue;
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
