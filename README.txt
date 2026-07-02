v47 Gemini API fix
- Гол алдаа key биш, app.js дотор Gemini API endpoint буруу байсан.
- Хуучин: /v1beta/interactions + input schema.
- Шинэ: /v1beta/models/{model}:generateContent + contents.parts schema.
- Models: gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash fallback.
- Stored key-ийг бүр мөсөн устгаж дахин дахин нэхдэг логикийг зассан.
Upload all files to GitHub root. At minimum overwrite app.js and index.html.
