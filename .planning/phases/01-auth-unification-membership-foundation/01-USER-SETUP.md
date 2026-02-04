# Phase 01-01: User Setup Required

This plan requires manual configuration of external services before the authentication features can be used.

## Google OAuth Configuration

**Service:** Google Cloud Console - OAuth 2.0
**Purpose:** Enable Google social login for On Poynt members

### Environment Variables

Add these to your `.env` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### Setup Steps

1. **Go to Google Cloud Console**
   - URL: https://console.cloud.google.com/

2. **Create or select a project**
   - If needed, create a new project for "On Poynt"

3. **Enable Google+ API** (if not already enabled)
   - Navigate to: APIs & Services > Library
   - Search for "Google+ API" and enable it

4. **Create OAuth 2.0 Credentials**
   - Navigate to: APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "On Poynt Production" (or similar)

5. **Configure Authorized Redirect URIs**

   Add these redirect URIs:

   **Production:**
   ```
   https://poynt.no/on-poynt/api/auth/callback/google
   ```

   **Development:**
   ```
   http://localhost:3000/on-poynt/api/auth/callback/google
   ```

6. **Copy credentials**
   - After creation, copy the "Client ID" and "Client Secret"
   - Add them to your `.env` file as shown above

### Verification

After configuration, verify Google OAuth is working:

1. Start the development server:
   ```bash
   bun run dev
   ```

2. Visit the login page and check for "Sign in with Google" button

3. Click the button - you should be redirected to Google's OAuth consent screen

4. After granting permissions, you should be redirected back to the application and logged in

### Troubleshooting

**"Error 400: redirect_uri_mismatch"**
- Check that the redirect URI in Google Cloud Console exactly matches the one configured in Better Auth
- Ensure no trailing slashes or typos

**Google OAuth button not appearing**
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- Restart the development server after adding environment variables

**"Access blocked: This app's request is invalid"**
- Ensure Google+ API is enabled for your project
- Check that OAuth consent screen is configured

## What Works Without Configuration

Without Google OAuth credentials, the application will still work but:
- Google sign-in button will not appear
- Users can still use magic link authentication (requires RESEND_API_KEY)
- Existing Better Auth sessions remain valid

## Next Steps

After configuring Google OAuth, proceed to:
- Plan 01-02: Account Linking (links Payload and Better Auth users via canonical email)
- Plan 01-03: Stripe Subscription Sync (syncs membership data from Stripe)
