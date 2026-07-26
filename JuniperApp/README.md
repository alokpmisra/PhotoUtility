# Juniper

Juniper is a funny, warm-hearted character who "flew in" from Jupiter to meet
and talk with kids. This is an MVP scaffold for a native iOS (SwiftUI) app.

## What's here

A talk-to-Juniper experience:
- Hold a button to talk, Juniper listens, thinks, and replies out loud in a
  funny pitched voice.
- A "Family" tab introduces Juniper's mom, **Birdy**, and is built to grow —
  new family members/friends are just data, not new screens.
- Juniper remembers simple facts about the kid (like their name and things
  they like) across sessions, and uses that memory to personalize replies.
- The AI brain uses Apple's on-device Foundation Models framework (Apple
  Intelligence) when available, and falls back to a rule-based responder
  otherwise so the app always works.

## Project setup (this repo only contains source files, no `.xcodeproj`,
matching the existing `PassportPhotoApp`)

1. In Xcode: **File > New > Project > App**, name it `JuniperApp`, interface
   SwiftUI, language Swift, minimum deployment iOS 17 (iOS 26 for the Apple
   Intelligence path).
2. Delete the generated `ContentView.swift`/`App.swift` and drag this
   `JuniperApp/JuniperApp` folder's contents into the project instead
   (checking "Copy items if needed" / "Create groups").
3. In the target's **Signing & Capabilities**, enable **Apple Intelligence**
   if targeting iOS 26+.
4. Add these `Info.plist` keys (Target > Info > Custom iOS Target
   Properties), required for voice input:
   - `NSMicrophoneUsageDescription` — "Juniper needs the mic to hear you talk!"
   - `NSSpeechRecognitionUsageDescription` — "Juniper uses speech recognition to understand you!"
5. Build & run on a physical device (the simulator can't record/recognize
   speech reliably, and Apple Intelligence needs a physical, supported
   device).

## Architecture (modular, so new context slots in cleanly)

```
Models/          CharacterProfile, JuniperFamily (data-driven cast), ConversationMessage, LearnedFact (SwiftData)
Services/AI/     JuniperAIResponding protocol -> AppleIntelligenceAIService (FoundationModels) / FallbackJuniperAIService
Services/Speech/ SpeechRecognizer (speech-to-text), JuniperVoiceSynthesizer (text-to-speech, per-character pitch)
Services/Memory/ KidMemoryStore (SwiftData-backed learning: remembers facts, simple extraction from what the kid says)
ViewModels/      JuniperConversationViewModel (listen -> think -> remember -> speak state machine)
Views/           ContentView (tabs), JuniperHomeView (talk to Juniper), FamilyView (meet the family), Components/
```

### Extending it
- **New family member/friend**: add one `CharacterProfile` to
  `JuniperFamily.all` (name, bio, catchphrases, voice pitch/rate, color).
  Family list and voice playback pick it up automatically.
- **Smarter memory/learning**: replace the pattern-matching in
  `KidMemoryStore.learnFromKidMessage` — everything downstream (AI prompt
  context, personalized replies) already consumes `facts: [String: String]`.
- **Different AI backend**: conform a new type to `JuniperAIResponding` and
  return it from `JuniperAIServiceFactory`.
- **New scenes/activities** (games, stories, lessons): add a new tab/view
  that reuses `JuniperConversationViewModel` with a different character or
  prompt context.

## Not yet built (waiting on more details)
- Visual character design/animation (currently a placeholder avatar).
- Additional family members/friends beyond Juniper and Birdy.
- Parental controls, screen-time limits, content moderation policy specifics.
- Onboarding flow, App Store assets, COPPA/kids-category compliance review.
