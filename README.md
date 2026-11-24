# Rozgaar

Frontline shift discovery, preparation and hiring in one local web app. The browser calls a Python API. SQLite stores accounts, job drives, preferences, saved jobs, practice results, applications and trial invitations.

## Run locally

```sh
python3 server.py
```

Open http://127.0.0.1:8000. Use Python 3.10 or later. The app creates its database in `.data/`. Keep the server running while using the site.

## Demo route

1. Choose **Enter worker demo** to load Anu Rao's account with saved jobs and sample trial statuses. Use the sign-in form to create a separate worker account.
2. Open Warehouse picker, Packing associate or Garment quality checker. Choose English, Hindi or Kannada narration. Use **Download MP4** to keep that clip for offline playback in the phone’s media player. The clips use pre-generated ElevenLabs audio, and Learn also shows the transcript.
3. Open **Profile**, then **Scan sample** or upload a PDF, PNG or JPEG. Review the extracted text and save the skills you want to share.
4. Sign out. Choose **Employer → Try employer demo** to open the hiring workspace. Review the application and send a phone, in-person or video trial invitation.
5. Re-enter the worker demo and confirm the invitation in **Applications**. The employer can then mark attendance.

The 18 original listings and the default accounts contain sample data. Demo mode shares two sample accounts across visitors to the same server. Use a private local session for judging or close the app to public access while demo mode is enabled.

## Enable résumé OCR

- **macOS:** Install the Apple Command Line Tools. `python3 server.py --prepare-ocr` compiles the Vision helper once so the first scan stays fast.
- **Linux:** Install Tesseract and Poppler. On Debian or Ubuntu, run `sudo apt install tesseract-ocr poppler-utils`. The Docker image includes both packages.
- An image is processed by OCR. A text PDF is read directly. A scanned PDF is rendered and recognized, up to its first three pages. Uploads are limited to 6 MB and processed in temporary storage. The app saves only the skills the worker chooses to keep.
- If the local engine cannot scan a PNG or JPEG, the app can download the pinned Tesseract.js engine and English language data and process the image in the browser. This fallback needs internet access to load its code and model. PDF scanning uses the server.

## Docker

```sh
docker build -t rozgaar .
docker volume create rozgaar-data
docker run --rm -p 8000:8000 -v rozgaar-data:/data rozgaar
```

## Private pilot configuration

Set `ROZGAAR_DEMO=0`, set `ROZGAAR_EMPLOYER_NAME`, `ROZGAAR_EMPLOYER_PHONE` and `ROZGAAR_EMPLOYER_PASSWORD` in the process environment to provision the first employer, and use a persistent `ROZGAAR_DATA_DIR`. Put an internet deployment behind an HTTPS reverse proxy and set `ROZGAAR_SECURE_COOKIES=1`. The local MVP uses mobile number plus password and server sessions. Trial invites appear inside Rozgaar. Phone verification, message delivery and AWS deployment are future integrations.

```text
Browser → same-origin HTTP API → SQLite
Résumé upload → local OCR process → review text and select skills
Employer invite → stored application status → worker confirmation
```
