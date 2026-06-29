Upload all files to the root of your GitHub repository. Do not upload the ZIP itself.
Enable Settings > Pages > Deploy from branch > main / root.

Update note v45:
- Fixed Gemini "high demand / try again later" issue by adding automatic retry and fallback model switching.
- First tries gemini-2.0-flash, then gemini-2.5-flash, then gemini-1.5-flash.
- Service worker cache version updated, so Android/PWA should fetch the new app.js after redeploy.
- Report first page is a clean introduction page with client info, system name, Sara info and author name at the bottom corner.
- Every report subsection starts on a new A4 report page.
- Added 3 built-in export actions: PDF, Word and Print.
- Every report page has a small logo in the top-right corner, positioned so it does not overlap the title/body.
- The client's real palm photo is not printed with text labels; the report uses one clean general hand map with marked main points.
- PDF export renders each A4 page separately to prevent broken/cut pages.
