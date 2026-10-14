# Real Firebase configuration belongs here

Place the Console downloads `google-services.json` and `GoogleService-Info.plist` here only after registering both apps as **com.osca.householdenergymobile**. They must belong to your real Firebase project. Both files are ignored by Git; none are fabricated.

See [stage-one setup](../docs/firebase-stage-one.md). Default trial and Expo Go builds do not require these files. Native account builds require `ENABLE_NATIVE_FIREBASE=1` and a new development build.
