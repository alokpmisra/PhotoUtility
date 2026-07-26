import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Talks to Apple's on-device Foundation Models (Apple Intelligence). Requires
/// iOS 26+ on supported hardware with Apple Intelligence enabled; check
/// `AppleIntelligenceAIService.isAvailable` before using, and fall back to
/// `FallbackJuniperAIService` otherwise.
@available(iOS 26.0, *)
final class AppleIntelligenceAIService: JuniperAIResponding {

    static var isAvailable: Bool {
        #if canImport(FoundationModels)
        switch SystemLanguageModel.default.availability {
        case .available: return true
        case .unavailable: return false
        }
        #else
        return false
        #endif
    }

    func respond(to kidMessage: String, context: JuniperConversationContext) async throws -> String {
        #if canImport(FoundationModels)
        let session = LanguageModelSession(instructions: instructions(for: context))
        let response = try await session.respond(to: kidMessage)
        return response.content
        #else
        throw JuniperAIError.backendUnavailable
        #endif
    }

    private func instructions(for context: JuniperConversationContext) -> String {
        let character = context.character
        let facts = context.knownFactsAboutKid
            .map { "\($0.key): \($0.value)" }
            .joined(separator: ", ")

        return """
        You are \(character.name), \(character.role), speaking to a young child.
        Personality: playful, warm, endlessly encouraging, a little silly, never scary or sarcastic.
        You come from \(character.homeworld) and love comparing Earth things to life back home.
        Keep replies to 1-3 short, simple sentences a young child can follow.
        Occasionally use one of these catchphrases when it fits naturally: \(character.catchphrases.joined(separator: " | ")).
        Never discuss anything unsafe, scary, violent, or inappropriate for a small child; gently redirect instead.
        \(facts.isEmpty ? "" : "What you remember about this child: \(facts).")
        """
    }
}

enum JuniperAIError: Error {
    case backendUnavailable
}
