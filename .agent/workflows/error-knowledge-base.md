---
description: Error Knowledge Base - Auto-Updating Log
version: 1.0
type: knowledge_base
---

# Error Resolution Knowledge Base

**Status:** AUTO-UPDATING  
**Total Entries:** 3  
**Last Updated:** 2025-12-06

> **Agent Instructions:** Add new error entries here when fixing errors (per POLICY-003)

---

## Quick Search Index

```yaml
categories: [Process Violation, Firebase Authentication, Android Dependencies]
tags: [process, backup, cleanup, firebase, capacitor, authentication, google-sign-in, gradle, dependencies, play-services]
severity_counts:
  critical: 1
  high: 1
  medium: 0
  low: 1
```

---

## Resolved Errors Log

<!-- BEGIN ERROR ENTRIES -->

### ERR-0001: Process Violation - Failed to delete .backup file

**Severity:** LOW  
**Date:** 2025-12-04  
**Tags:** `process` `backup` `cleanup`

**Symptoms:**
- User reported ".backup files" were not deleted after successful commands
- `resources/views/partials/alerts.blade.php.backup` remained in the file system

**Root Cause:**
Agent successfully modified the file but failed to execute the cleanup step (removing the backup) as required by `file-backup.rules`.

**Solution (Step-by-Step):**
1. Run cleanup command: `rm resources/views/partials/alerts.blade.php.backup`
2. Verify file is removed

**Prevention:**
- Always chain the cleanup command immediately after verification
- Double-check the `file-backup.rules` checklist before finishing the turn
- Treat the "Cleanup" step as mandatory as the "Modify" step

**Related Tasks:**
- Any file modification task requiring backups

---

### ERR-0002: Firebase Authentication - GoogleAuthProviderHandler null object reference

**Severity:** HIGH  
**Date:** 2025-12-06  
**Tags:** `firebase` `capacitor` `authentication` `google-sign-in` `plugin-configuration`

**Symptoms:**
- Google Sign-In button fails with error message: "Sign in failed. Check console."
- Logcat shows: `Attempt to invoke virtual method 'void io.capawesome.capacitorjs.plugins.firebase.authentication.handlers.GoogleAuthProviderHandler.signIn(com.getcapacitor.PluginCall)' on a null object reference`
- OAuth client credentials are correctly configured in `google-services.json`
- SHA-1 fingerprint is registered in Firebase Console

**Root Cause:**
The `@capacitor-firebase/authentication` plugin requires explicit configuration in `capacitor.config.ts`. The `GoogleAuthProviderHandler` is not initialized because the plugin wasn't configured with `skipNativeAuth: false` and provider list.

**Solution (Step-by-Step):**
1. Open `capacitor.config.ts`
2. Add plugin configuration inside the `plugins` object:
   ```typescript
   plugins: {
     FirebaseAuthentication: {
       skipNativeAuth: false,
       providers: ['google.com']
     }
   }
   ```
3. Run: `npm run build && npx cap sync android`
4. Rebuild APK: `cd android && ./gradlew assembleDebug`
5. Install on device: `adb install -r app-debug.apk`
6. Verify: Google Sign-In should now show account picker

**Prevention:**
- Always configure Capacitor Firebase plugins in `capacitor.config.ts` before using them
- For `@capacitor-firebase/authentication`, set `skipNativeAuth: false` for native platform support
- List all authentication providers you intend to use (e.g., `['google.com', 'apple.com']`)
- Check plugin documentation for required configuration parameters

**Related Tasks:**
- Implementing any Firebase Authentication provider (Google, Apple, Facebook, etc.)
- Setting up social login in Capacitor apps
- Integrating third-party authentication plugins

---

### ERR-0003: Firebase Authentication - App crashes on startup (NoClassDefFoundError)

**Severity:** CRITICAL  
**Date:** 2025-12-06  
**Tags:** `firebase` `android` `gradle` `dependencies` `google-play-services` `crash`

**Symptoms:**
- App crashes immediately upon opening
- Logcat shows: `FATAL EXCEPTION: main` with `NoClassDefFoundError: Failed resolution of: Lcom/google/android/gms/auth/api/signin/GoogleSignIn;`
- Plugin registers successfully: `Registering plugin instance: FirebaseAuthentication`
- Crash occurs at `GoogleAuthProviderHandler.<init>`

**Root Cause:**
The `@capacitor-firebase/authentication` plugin requires the Google Play Services Auth library, which is not automatically included. The Firebase Authentication plugin tries to use `GoogleSignIn` class but it's not available in the app's dependencies.

**Solution (Step-by-Step):**
1. Open `android/app/build.gradle`
2. Add Google Play Services Auth dependency to the `dependencies` block:
   ```gradle
   dependencies {
       // ... existing dependencies ...
       implementation 'com.google.android.gms:play-services-auth:21.0.0'
   }
   ```
3. Rebuild: `cd android && ./gradlew assembleDebug`
4. Install: `adb install -r app-debug.apk`
5. Verify: App should launch without crashing

**Prevention:**
- When using `@capacitor-firebase/authentication`, **always** add Google Play Services Auth dependency
- Check plugin documentation for required Android dependencies
- For Capacitor Firebase plugins, verify all Google Play Services libraries are included
- Test app startup on a clean install to catch missing dependency crashes early

**Related Tasks:**
- Integrating Firebase Authentication
- Adding social login (Google, Facebook, etc.)
- Using any Google Play Services features (Maps, Location, etc.)

---

<!-- END ERROR ENTRIES -->

---

**Instructions:**
- Add new entries at the bottom
- Use template from `error-resolution.md`
- Update Quick Search Index
- Increment error count
