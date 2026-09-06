# Reflections — Private Journaling App

> **A journal first, AI at the edges — NOT a chatbot.**
> *"Most AI journals talk at you. Reflections stays quiet until you ask — and never reads what you keep private."*

Reflections is a production-grade private journaling application. The user writes alone on a silent, distraction-free page where nothing responds mid-writing. The AI operates strictly as an optional, edge companion:
1. Offers a gentle, non-pushy starting prompt on the home page.
2. After the user taps **Done** (with **Reflect with me** enabled), reads the verbatim text solely to suggest a mood from a fixed 8-item set and provide an optional four-layer reflection.
3. When **Reflect with me** is toggled **OFF**, the text is stored verbatim without contacting the AI at all — unread and untagged.

---

## Architecture & Security Highlights

- **Mandatory Server-Side Gemini Proxy**: No Gemini keys are ever exposed to the client. All generative calls route through backend endpoints running inside Node.js/Express.
- **Firebase Token Verification**: Incoming requests carry the Firebase ID token in the `Authorization: Bearer <token>` header. The backend validates the token via Firebase Admin SDK and derives the user's `uid` directly from the verified token.
- **Per-User Firestore Isolation**: Entries are stored at `/users/{userId}/entries/{entryId}`, and preferences at `/users/{userId}/profile/{profileId}`. Path-bound rules enforce `request.auth.uid == userId`.
- **Zero-Hardcoding & Secret Manager**: Production credentials (`GEMINI_API_KEY`) are dynamically provisioned using Google Cloud Secret Manager.
- **Resilient Fallback Ladder**: Backend generation sequentially cascades across `gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash` with automatic error recovery for transient failures (503, 429, 404, 500).
- **Undefined-Stripping & Non-Destructive UI**: Clean payload hygiene guarantees no `undefined` properties reach the database driver. If a save fails, the user's written words are preserved in the editor with an accessible retry banner.

---

## Prerequisites & Google Cloud APIs

1. **Install the Google Cloud CLI (`gcloud`)** and log in:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Enable Required Google Cloud APIs**:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     cloudbuild.googleapis.com \
     iam.googleapis.com
   ```

---

## 1. Secret Management Setup (Secret Manager)

Store your Gemini API key securely in Secret Manager and grant access to the Cloud Run runtime service account:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Identify your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# 3. Grant the Compute Engine service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 2. Cloud Firestore Security Rules

Deploy the owner-bound Firestore security rules located in `firestore.rules`:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Default deny catch-all
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isValidId(id) {
      return id is string && id.size() > 0 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    function isValidEntry(data) {
      return data.keys().hasAll(['rawText', 'reflectWithMe', 'createdAt'])
        && data.rawText is string
        && data.rawText.size() <= 50000
        && data.reflectWithMe is bool
        && (data.mood == null || (data.mood is string && data.mood in [
          'calm', 'content', 'energized', 'frustrated', 'anxious', 'drained', 'low', 'numb'
        ]))
        && (data.summary == null || (data.summary is string && data.summary.size() <= 2000))
        && (data.createdAt is timestamp || data.createdAt is string);
    }

    function isValidProfile(data) {
      return data.theme is string
        && data.theme in ['day', 'evening', 'system'];
    }

    match /users/{userId} {
      match /profile/{docId} {
        allow read: if isOwner(userId) && isValidId(docId);
        allow create, update: if isOwner(userId) && isValidId(docId) && isValidProfile(incoming());
        allow delete: if isOwner(userId) && isValidId(docId);
      }

      match /entries/{entryId} {
        allow get: if isOwner(userId) && isValidId(entryId);
        allow list: if isOwner(userId);
        allow create: if isOwner(userId) && isValidId(entryId) && isValidEntry(incoming());
        allow update: if isOwner(userId) && isValidId(entryId) && isValidEntry(incoming())
          && incoming().createdAt == existing().createdAt;
        allow delete: if isOwner(userId) && isValidId(entryId);
      }
    }
  }
}
```

Deploy the rules using Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 3. Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   GEMINI_API_KEY="YOUR_KEY"
   VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
   VITE_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT"
   VITE_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="SENDER_ID"
   VITE_FIREBASE_APP_ID="APP_ID"
   FIREBASE_PROJECT_ID="YOUR_PROJECT"
   ```

3. Start unified development server (Express + Vite on port 3000):
   ```bash
   npm run dev
   ```

---

## 4. Google Cloud Run Deployment

Deploy the containerized full-stack application directly to Google Cloud Run using Google Cloud Buildpacks:

```bash
# Build & deploy to Cloud Run
gcloud run deploy reflections-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=$(gcloud config get-value project)"
```

---

## 5. Required Campaign Labeling (Verification Binding)

Apply the mandatory resource label to register the service for automated challenge verification:

```bash
gcloud run services update reflections-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## Functional Verification Walkthrough

Every user interaction has a concrete walkthrough test:
1. **Screen 1 (Login)**: Click *Continue with Google*. Verifies passwordless authentication.
2. **Screen 2 (Home / Write Tab)**: Check personalized time-aware greeting (*"Good morning/afternoon/evening, {name}"*), view gentle starter prompt, test *Different prompt* button. Click *Begin writing*.
3. **Screen 3 (Writing Page)**:
   - Type in the calm, distraction-free serif text area. Verify no auto-responses appear while typing.
   - Observe the one-time informational banner. Click *Understood* to dismiss.
   - Toggle **Reflect with me** OFF: Verify starter prompt hides, and status changes to *"This entry will not be read or tagged."*
   - Tap **Done** with Reflect OFF: Verify text saves immediately without contacting Gemini, confirmed with *"Saved — just yours, unread and untagged."*
   - Toggle **Reflect with me** ON, write an entry, and tap **Done**: Verify Gemini produces a condensation and suggests 1 mood from the fixed 8-item set.
   - Test changing the mood chip, unfolding the 4-layer reflection (*Surface thought → Possible assumption → Possible feeling → A question to sit with*), and confirm saving.
4. **Screen 4 (Analytics Tab)**:
   - **Bandwidth Map**: View 2-axis capacity plot (*Cognitive load vs. Emotional capacity*) across the four quadrants (*Calm & open, Busy but coping, Running on reserves, Overloaded*). Tap any dot to view that day's entry.
   - **Clustered Dots**: If multiple entries share coordinates, verify count badge appears and tapping opens multi-date tabs in Day-detail view.
   - **Mood Timeline**: View 14-day history with colored mood chips and dashed gaps for private days.
   - **Weekly Mirror**: Tap *Open this week's mirror* to summon the Gemini-written weekly letter.
   - **Habit Tracker**: Review 7-day intention hit/miss statuses.
5. **Screen 5 (Settings / Account)**:
   - Tap avatar in header.
   - **Row 1 (Appearance)**: Toggle Day (*warm aged-amber paper*) and Evening (*warm espresso brown-black*).
   - **Row 2 (Export my data)**: Click *Download JSON*. Downloads `reflections-export.json`.
   - **Row 3 (Delete my account)**: Click *Delete account*. Verify two-step destructive warning nudging export first. Confirm *Delete everything*.
6. **Screen 6 (Day-detail View)**:
   - Tap any recent entry on Home or any dot on the Bandwidth Map. Verify verbatim text is displayed untouched. If untagged/private, verify notice that entry was never read or tagged.
