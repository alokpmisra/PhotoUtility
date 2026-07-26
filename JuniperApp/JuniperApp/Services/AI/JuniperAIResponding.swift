import Foundation

/// Context handed to whichever AI backend is answering, so the reply stays
/// in-character and personalized without the backend knowing anything
/// about SwiftUI, speech, or persistence.
struct JuniperConversationContext {
    let character: CharacterProfile
    let recentHistory: [ConversationMessage]
    let knownFactsAboutKid: [String: String]
}

/// Anything that can play Juniper (or another family member) in a chat turn.
/// Swap implementations freely — the rest of the app only depends on this protocol.
protocol JuniperAIResponding {
    func respond(to kidMessage: String, context: JuniperConversationContext) async throws -> String
}
