import httpx
from fastapi import APIRouter, Query
from fastapi.responses import HTMLResponse, JSONResponse

router = APIRouter(prefix="/api/auth", tags=["oauth"])

_SCHEME = "com.CommunItIs.myapp"
_HOST = "login-callback"
_PACKAGE = "com.CommunItIs.myapp"


@router.get("/oauth-redirect")
async def oauth_redirect(url: str = Query(...)):
    """Follow Supabase's authorize 302 server-side and return Google's URL.

    Supabase sends ``Content-Security-Policy: sandbox`` on the 302, which
    blocks scripts on Google's sign-in page when Chrome on Android follows
    the redirect.  Skipping the redirect on the client and opening Google
    directly bypasses the CSP.
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


# Chrome on Android blocks automatic ``window.location`` redirects to custom
# schemes — they must be initiated by a user gesture, *or* go through an
# ``intent://`` URI.  We use intent:// as the primary path (auto-fires) and
# also render a visible button as a manual fallback.
_CALLBACK_HTML = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>חוזר לאפליקציה...</title>
<style>
  body {{
    background: #0f172a;
    color: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
    direction: rtl;
    text-align: center;
    padding: 1rem;
  }}
  .box {{ max-width: 360px; }}
  #msg {{ font-size: 1.1rem; color: #14b8a6; margin: 0 0 1rem; }}
  #btn {{
    display: none;
    background: #14b8a6;
    color: white;
    border: 0;
    padding: 0.8rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    margin-top: 1rem;
    text-decoration: none;
  }}
  #btn:active {{ background: #0d9488; }}
  #err {{ color: #ef4444; font-size: 0.9rem; margin-top: 1rem; white-space: pre-wrap; }}
</style>
</head>
<body>
<div class="box">
  <p id="msg">חוזר לאפליקציה...</p>
  <a id="btn" href="#">חזור לאפליקציה</a>
  <p id="err"></p>
</div>
<script>
(function() {{
  var SCHEME = "{_SCHEME}";
  var HOST = "{_HOST}";
  var PACKAGE = "{_PACKAGE}";

  var search = window.location.search || "";
  var hash = window.location.hash || "";
  var qp = new URLSearchParams(search);
  var hp = new URLSearchParams(hash.replace(/^#/, ""));

  // הצגת שגיאה אם הגיעה
  var err = qp.get("error") || hp.get("error");
  if (err) {{
    var desc = qp.get("error_description") || hp.get("error_description") || err;
    document.getElementById("msg").textContent = "שגיאה באימות";
    document.getElementById("err").textContent = decodeURIComponent(desc);
    return;
  }}

  // בנייה של ה-deep link עם אותם פרמטרים
  var hasParams = false;
  var paramsSuffix = "";
  if (qp.get("code")) {{
    paramsSuffix = search;
    hasParams = true;
  }} else if (hp.get("access_token")) {{
    paramsSuffix = hash;
    hasParams = true;
  }}

  if (!hasParams) {{
    document.getElementById("msg").textContent = "אין פרמטרים בקריאה החוזרת";
    return;
  }}

  var deepLink = SCHEME + "://" + HOST + paramsSuffix;

  // intent:// URI — Chrome Android יורה את ה-app אוטומטית גם בלי user gesture.
  // ה-fragment מקודד בתוך ה-intent (אחרי #Intent;).
  // אנחנו לא יכולים לשים fragment בתוך intent://, אז במקרה implicit (#access_token)
  // נשתמש ב-deep link רגיל; ב-PKCE (?code=) נשתמש ב-intent.
  var intentUrl;
  if (paramsSuffix.charAt(0) === '?') {{
    intentUrl = "intent://" + HOST + paramsSuffix +
                "#Intent;scheme=" + SCHEME +
                ";package=" + PACKAGE +
                ";end";
  }} else {{
    // implicit: fragment ארוך — לא נכנס יפה ב-intent. ננסה deep link ישיר.
    intentUrl = deepLink;
  }}

  // הצגת כפתור fallback מיד
  var btn = document.getElementById("btn");
  btn.href = deepLink;
  btn.style.display = "inline-block";

  // ניסיון אוטומטי
  setTimeout(function() {{
    window.location.replace(intentUrl);
  }}, 100);

  // אם תוך 2.5 שניות לא קרה כלום — עדכן הודעה
  setTimeout(function() {{
    document.getElementById("msg").textContent = "האפליקציה לא נפתחה אוטומטית";
    document.querySelector(".box").insertBefore(
      Object.assign(document.createElement("p"), {{
        textContent: "לחץ על הכפתור כדי לחזור לאפליקציה",
        style: "color:#94a3b8;font-size:0.9rem;margin:0"
      }}),
      btn
    );
  }}, 2500);
}})();
</script>
</body>
</html>
"""


@router.get("/native-callback")
async def native_callback():
    """Static HTML that deep-links into the Capacitor app.

    Reads ``?code=`` (PKCE) or ``#access_token=`` (implicit) on the client
    side because fragments aren't visible to the server.  Uses an
    ``intent://`` URI for auto-launch on Android and falls back to a visible
    button if Chrome blocks the redirect.
    """
    return HTMLResponse(_CALLBACK_HTML)
