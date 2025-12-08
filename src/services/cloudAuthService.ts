import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { SecureStorageService } from './secureStorageService';
import { auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

export const CloudAuthService = {
    async signInWithGoogle(): Promise<User | null> {
        try {
            const result = await FirebaseAuthentication.signInWithGoogle();
            const { user } = result;

            // Extract the Google ID Token (OIDC) from the credential
            // This is required to authenicate the Firebase Web SDK
            const googleIdToken = result.credential?.idToken;
            const googleAccessToken = result.credential?.accessToken;

            // Sync Firebase Web SDK auth state using the Google ID token
            if (googleIdToken) {
                try {
                    const credential = GoogleAuthProvider.credential(googleIdToken, googleAccessToken);
                    await signInWithCredential(auth, credential);
                } catch (authError) {
                    console.error('Firebase Auth sync failed:', authError);
                }
            } else {
                console.warn('No Google ID Token found in sign-in result');
            }

            if (user) {
                await this.saveUser(user);
                return {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoUrl,
                };
            }
            return null;
        } catch (error) {
            console.error('Google Sign-In failed:', error);
            return null;
        }
    },

    async signOut(): Promise<void> {
        try {
            await FirebaseAuthentication.signOut();
            await SecureStorageService.remove('cloud_user');
        } catch (error) {
            console.error('Sign‑Out failed:', error);
        }
    },

    async getCurrentUser(): Promise<User | null> {
        try {
            const result = await FirebaseAuthentication.getCurrentUser();
            if (result.user) {
                return {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoUrl
                };
            }
            return await SecureStorageService.get<User>('cloud_user');
        } catch (error) {
            // Fallback to local storage if plugin fails (e.g., offline)
            return await SecureStorageService.get<User>('cloud_user');
        }
    },

    async saveUser(user: any) {
        const cleanUser: User = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoUrl
        };
        await SecureStorageService.set('cloud_user', cleanUser);
    }
};

