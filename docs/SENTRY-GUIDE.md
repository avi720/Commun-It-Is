# Sentry — מדריך שימוש מהיר

> **Account:** [https://avior-0b.sentry.io](https://avior-0b.sentry.io) (EU region, ingest.de.sentry.io)
> **Projects:** `commun-it-is-frontend` (React) · `commun-it-is-backend` (Python/FastAPI)
> **DSNs:** ב-`.env.example`. ה-frontend DSN public — נכנס ל-bundle. ה-backend DSN רץ רק בצד server.

---

## 1. הפעלה ראשונה — מה אתה צריך לעשות פעם אחת

### Vercel ENV vars
פתח את [Vercel Dashboard → commun-it-is → Settings → Environment Variables](https://vercel.com/avior-paz-s-projects/commun-it-is/settings/environment-variables) והוסף שני משתנים:

| Name | Value | Environments |
|---|---|---|
| `VITE_SENTRY_DSN` | `https://3472825522b1f0003df66d3a7dc9f5f5@o4511542659645440.ingest.de.sentry.io/4511546843136080` | Production + Preview |
| `SENTRY_DSN` | `https://6e3a90c05767db5ef8488417c522c0a2@o4511542659645440.ingest.de.sentry.io/4511546858995792` | Production + Preview |

ה-`VITE_` קידומת מסמנת שהמשתנה ייכלל ב-bundle של ה-frontend (זה בכוונה — ה-DSN public). ה-backend DSN נשאר server-only.

**אחרי שתוסיף את שני המשתנים — Redeploy ידני של ה-production:** Dashboard → Deployments → ⋯ → Redeploy. (או שתחכה לpush הבא — Vercel ירים אוטומטית.)

### בדיקה ש-Sentry באמת קולט
פתח את https://commun-it-is.vercel.app בדפדפן (אחרי שה-redeploy סיים), פתח **DevTools Console** (F12), והרץ:

```js
throw new Error("sentry-test-frontend")
```

תוך 30 שניות זה אמור להופיע ב-[Sentry Issues page של commun-it-is-frontend](https://avior-0b.sentry.io/projects/commun-it-is-frontend/). אם רואה אותו — Sentry קולט. אם לא, בדוק:
1. שה-ENV vars נוצרו ב-Vercel
2. שהיה redeploy אחרי הוספתם
3. שבדפדפן ה-bundle עודכן (Ctrl+Shift+R לרענון קשיח)

לבדיקת backend:
```bash
# ההגדרות הנוכחיות חוסמות /api/users (T1). פגיעה מכוונת בנתיב שלא קיים:
curl https://commun-it-is.vercel.app/api/nonexistent-endpoint-for-test
```
זה יחזיר 404 אבל **לא** יעלה ל-Sentry (404 הוא response תקין). לבדיקה מלאה של backend תצטרך לחכות לשגיאת runtime אמיתית (Sentry יקבל אותה אוטומטית), או שאני יכול להוסיף endpoint זמני לבדיקה אם תרצה.

---

## 2. שגרת עבודה יומיומית

### תקבל מייל כש...
ברירת המחדל ב-Sentry: **High priority issues**. הוא יישלח לך מייל ל-`avi.paz159@gmail.com` כש:
- שגיאה חדשה מופיעה לראשונה
- שגיאה קיימת מתחילה לקרות לרבע מהמשתמשים תוך שעה
- שגיאה שסומנה כפתורה חוזרת (Regression)

### זרימת עבודה — שגיאה חדשה
1. תקבל מייל / push (אם הפעלת)
2. תיכנס ל-https://avior-0b.sentry.io/issues
3. תלחץ על השגיאה. תראה:
   - **Stack trace** — איפה השגיאה (קובץ + שורה). ב-prod זה minified — כדי לקבל unminified נצטרך source maps (אופציה ל-T28 בעתיד)
   - **Breadcrumbs** — רצף הקליקים/ניווטים שהובילו לשגיאה (כולל network requests)
   - **User** — UUID של המשתמש (לא שם/מייל). אפשר ללחוץ עליו ולראות עוד שגיאות שלו
   - **Browser + OS + URL** — סביבה
   - **Session Replay** (אם קיים) — וידאו של ה-session, עם טקסט מוסתר. רק לשגיאות
4. החלטה:
   - **תיקון** — תקן בקוד, push, ו-Sentry יזהה אוטומטית שזה תוקן (ב-release הבא)
   - **דחייה / Ignore** — לחץ ⋯ → Ignore. אם זו לא באמת באג (למשל extension של דפדפן זורק)
   - **Resolved** — סמן כפתור. אם זה יחזור, Sentry יפתח אותו מחדש כ-Regression
   - **Snooze** — דחה אותו ל-X זמן (אם זו בעיה לא דחופה)

### Prioritization
Sentry מסדר אוטומטית לפי `Priority` שמשלב:
- כמה משתמשים מושפעים
- כמה פעמים זה קרה
- האם זה חדש או הרגרסיה

ראשון לטיפול: **High priority + new**.

---

## 3. מה Sentry **רואה ולא רואה**

| רואה | לא רואה |
|---|---|
| Stack trace + file:line | localStorage / cookies |
| URL ו-route | Supabase auth tokens (T10 כיסה את זה) |
| Browser + OS + viewport | תוכן של inputs / forms |
| User UUID (Supabase user.id) | שם, מייל, טלפון של המשתמש |
| רצף ה-breadcrumbs (קליקים + navigation + console.error) | Session replay של sessions רגילים (רק כשיש שגיאה) |
| Release SHA (אוטומטי מ-Vercel) | IP address (sendDefaultPii=false) |

אם תרצה לקבל יותר context (למשל שם המשתמש בלוג, או שם הקהילה), אפשר להוסיף `Sentry.setContext("user_profile", { city, community_id })` ב-AppContext — לא PII, אבל מועיל לדיבאג. תגיד לי אם תרצה.

---

## 4. ה-Schedule routine

יש לי routine שאני אמור להריץ פעם ב-3 ימים שתעשה:
1. תשלוף את ה-unresolved issues מ-Sentry API (frontend + backend)
2. תכין סיכום בעברית: כמה new, top 3 high priority, סטטוס keep-alive של ה-tracker
3. תשלח לך ב-claude.ai

הוא נוצר ב-step הבא. תוכל לבטל אותו בכל רגע עם `/schedule list` → `/schedule delete <id>`.

---

## 5. מה לעשות אם Sentry "רועש" יותר מדי

- **שגיאות לא-באגים**: Ignore אותן. Sentry לא יציג אותן שוב
- **שגיאות צד-לקוח של extensions**: Sentry יכול לסנן אוטומטית עם InboundFilters — נוסיף אם נראה הרבה
- **תקרת free tier מתקרבת** (5K אירועים/חודש): נוריד את `tracesSampleRate` או נוסיף sampling filters
- **session replays יקרים**: כרגע 0% sessions רגילים + 100% רק על שגיאות — שמרני וטוב

---

## 6. אם תרצה להעלות ל-paid tier בעתיד

ה-Team plan עולה $26/חודש ונותן:
- 50K שגיאות/חודש (10x)
- 50 session replays יותר
- 2 משתמשים
- 90 ימי שמירה במקום 30
- alerts ל-Slack/Discord

לפי הנתונים הצפויים שלך (קהילה אחת, ~200 משתמשים), ה-free tier יספיק בקלות. תשדרג רק אם תפתח לקהילות נוספות.
