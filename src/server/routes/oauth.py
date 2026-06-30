import httpx
from fastapi import APIRouter, Query
from fastapi.responses import HTMLResponse, JSONResponse

router = APIRouter(prefix="/api/auth", tags=["oauth"])


@router.get("/oauth-redirect")
async def oauth_redirect(url: str = Query(...)):
    """Extract the Google OAuth URL from a Supabase authorize 302.

    Supabase's ``/auth/v1/authorize`` returns ``Content-Security-Policy:
    sandbox`` on its 302, which causes Chrome on Android to block scripts on
    Google's sign-in page (blank screen).  We follow the redirect server-side
    and return Google's URL so the client can open it directly.
    """
    if "supabase.co/auth/v1/authorize" not in url:
        return JSONResponse({"error": "Invalid URL"}, status_code=400)

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, follow_redirects=False)

    location = resp.headers.get("location")
    if not location:
        return JSONResponse(
            {"error": f"No redirect (status {resp.status_code})"},
            status_code=502,
        )
    return {"url": location}


_CALLBACK_HTML = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>חוזר לאפליקציה...</title>
<style>
  body {
    background: #0f172a;
    color: #14b8a6;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
    direction: rtl;
    text-align: center;
    padding: 1rem;
  }
  #msg { font-size: 1.1rem; }
  #err { color: #ef4444; font-size: 0.9rem; margin-top: 1rem; white-space: pre-wrap; }
</style>
</head>
<body>
<div>
  <p id="msg">חוזר לאפליקציה...</p>
  <p id="err"></p>
</div>
<script>
(function() {
  var deepLink = "com.CommunItIs.myapp://login-callback";
  var search = window.location.search || "";
  var hash = window.location.hash || "";

  // קריאת error בכל סוג זרימה (query או hash)
  var qp = new URLSearchParams(search);
  var hp = new URLSearchParams(hash.replace(/^#/, ""));
  var err = qp.get("error") || hp.get("error");
  if (err) {
    var desc = qp.get("error_description") || hp.get("error_description") || err;
    document.getElementById("msg").textContent = "שגיאה באימות";
    document.getElementById("err").textContent = decodeURIComponent(desc);
    return;
  }

  // בנייה של ה-deep link עם אותם פרמטרים שהגיעו
  var target = deepLink;
  if (qp.get("code")) {
    target += search;
  } else if (hp.get("access_token")) {
    target += hash;
  } else {
    document.getElementById("msg").textContent = "אין פרמטרים בקריאה החוזרת";
    return;
  }

  window.location.replace(target);

  setTimeout(function() {
    document.getElementById("msg").textContent = "אם האפליקציה לא נפתחה אוטומטית, חזור אליה ידנית.";
  }, 2500);
})();
</script>
</body>
</html>
"""


@router.get("/native-callback")
async def native_callback():
    """Serve a static HTML page that deep-links into the Capacitor app.

    The page reads ``?code=`` (PKCE) or ``#access_token=`` (implicit) on the
    client side and redirects to ``com.CommunItIs.myapp://login-callback``
    with the same parameters.  We can't read the fragment on the server, so
    everything is handled in JS.
    """
    return HTMLResponse(_CALLBACK_HTML)
