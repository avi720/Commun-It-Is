import json
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Query
from fastapi.responses import HTMLResponse, JSONResponse

router = APIRouter(prefix="/api/auth", tags=["oauth"])


@router.get("/oauth-redirect")
async def oauth_redirect(url: str = Query(...)):
    """Extract the Google OAuth URL from a Supabase authorize 302.

    Supabase's ``/auth/v1/authorize`` returns a ``Content-Security-Policy:
    sandbox`` header on its 302 response, which causes Chrome on Android to
    sandbox the redirect target (Google's sign-in page) — scripts are blocked
    and the user sees a blank screen.

    This endpoint follows the 302 server-side and returns the Location URL so
    the mobile client can open Google directly, bypassing the CSP.
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


@router.get("/native-callback")
async def native_callback(
    code: str = Query(None),
    error: str = Query(None),
    error_description: str = Query(None),
):
    """Handle Supabase OAuth callback for the native (Capacitor) app.

    After the user authenticates with Google, Supabase redirects here with a
    PKCE ``code``.  This page renders a minimal HTML document that immediately
    redirects to the app's deep-link URL, where ``useNativeAuthCallback``
    picks up the code and calls ``exchangeCodeForSession``.

    Why not redirect straight from Supabase to the deep-link?  Because
    Supabase's callback 303 also carries ``Content-Security-Policy: sandbox``,
    and Chrome may refuse to follow a redirect to a custom-scheme URL under
    sandbox restrictions.
    """
    if error:
        safe_msg = json.dumps(error_description or error)
        return HTMLResponse(
            f'<!DOCTYPE html><html><body style="background:#0f172a;color:#ef4444;'
            f'display:flex;align-items:center;justify-content:center;height:100vh;'
            f'font-family:sans-serif;direction:rtl">'
            f"<p>שגיאה באימות: {error_description or error}</p>"
            f"</body></html>",
            status_code=400,
        )

    if not code:
        return HTMLResponse("Missing code parameter", status_code=400)

    safe_code = json.dumps(code)

    return HTMLResponse(
        f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0f172a;color:#14b8a6;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;direction:rtl">
<p>חוזר לאפליקציה...</p>
<script>
var code = {safe_code};
window.location.assign("com.CommunItIs.myapp://login-callback?code=" + encodeURIComponent(code));
setTimeout(function() {{
  document.querySelector("p").textContent = "אם האפליקציה לא נפתחה, חזור אליה ידנית.";
}}, 3000);
</script>
</body>
</html>"""
    )
