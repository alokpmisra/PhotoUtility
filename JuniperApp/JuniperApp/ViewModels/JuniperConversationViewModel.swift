import Foundation

@MainActor
final class JuniperConversationViewModel: ObservableObject {
    enum State: Equatable {
        case idle
        case listening
        case thinking
        case speaking
    }

    @Published private(set) var state: State = .idle
    @Published private(set) var messages: [ConversationMessage] = []
    @Published var errorMessage: String?

    let character: CharacterProfile

    private let aiService: JuniperAIResponding
    private let speechRecognizer: SpeechRecognizer
    private let voiceSynthesizer: JuniperVoiceSynthesizer
    private let memoryStore: KidMemoryStore

    init(
        character: CharacterProfile,
        aiService: JuniperAIResponding,
        speechRecognizer: SpeechRecognizer,
        voiceSynthesizer: JuniperVoiceSynthesizer,
        memoryStore: KidMemoryStore
    ) {
        self.character = character
        self.aiService = aiService
        self.speechRecognizer = speechRecognizer
        self.voiceSynthesizer = voiceSynthesizer
        self.memoryStore = memoryStore
    }

    var liveTranscript: String { speechRecognizer.transcript }

    func startTalking() async {
        guard state == .idle else { return }

        let authorized = await speechRecognizer.requestAuthorization()
        guard authorized else {
            errorMessage = speechRecognizer.authorizationError
            return
        }

        do {
            try speechRecognizer.startListening()
            state = .listening
        } catch {
            errorMessage = "I couldn't hear you that time — let's try again!"
        }
    }

    /// Called when the kid releases the talk button.
    func finishTalking() async {
        guard state == .listening else { return }
        speechRecognizer.stopListening()

        let kidText = speechRecognizer.transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !kidText.isEmpty else {
            state = .idle
            return
        }

        messages.append(ConversationMessage(speaker: .kid, text: kidText, timestamp: .now))
        memoryStore.learnFromKidMessage(kidText)

        state = .thinking
        do {
            let context = JuniperConversationContext(
                character: character,
                recentHistory: Array(messages.suffix(6)),
                knownFactsAboutKid: memoryStore.facts
            )
            let reply = try await aiService.respond(to: kidText, context: context)
            messages.append(ConversationMessage(speaker: .character(character), text: reply, timestamp: .now))

            state = .speaking
            voiceSynthesizer.speak(reply, as: character)
            // Voice playback runs independently; return to idle so the talk
            // button is tappable again while Juniper finishes speaking.
            state = .idle
        } catch {
            errorMessage = "Juniper got a little dizzy from comet travel — try again!"
            state = .idle
        }
    }
}
