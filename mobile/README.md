# Application Android Judo Caisse

Application native Android (Capacitor) connectée aux **mêmes données** que la version web via :

**https://judo-caisse.vercel.app**

## Prérequis

- Node.js
- Android SDK (déjà utilisé pour la compilation)
- Java 17+

## Commandes

```bash
cd mobile
npm install
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

L’APK généré se trouve dans :

`mobile/android/app/build/outputs/apk/debug/app-debug.apk`
