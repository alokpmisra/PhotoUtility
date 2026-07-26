import Foundation

/// Rule-based backup so Juniper still responds on devices/simulators where
/// Apple Intelligence isn't available. Deliberately simple; the on-device
/// model is the "real" brain whenever it can be used.
final class FallbackJuniperAIService: JuniperAIResponding {

    func respond(to kidMessage: String, context: JuniperConversationContext) async throws -> String {
        let character = context.character
        let lowered = kidMessage.lowercased()
        let name = context.knownFactsAboutKid["name"]

        if lowered.contains("hi") || lowered.contains("hello") || lowered.contains("hey") {
            let greetingName = name.map { ", \($0)" } ?? ""
            return "\(character.catchphrases.first ?? "Hello there") Hi\(greetingName)! It's \(character.name) here!"
        }
        if lowered.contains("how are you") {
            return "I'm bouncier than a comet today! How about you?"
        }
        if lowered.contains("jupiter") || lowered.contains("space") || lowered.contains("planet") {
            return "Oh, \(character.homeworld) is SO swirly and stormy — way bigger than Earth! Want to hear a space story?"
        }
        if lowered.contains("bye") || lowered.contains("goodbye") {
            return "Aw, comet-crumbs! Bye for now — I'll be zooming around thinking of you!"
        }

        return "\(character.catchphrases.randomElement() ?? "Wow!") Tell me more about that!"
    }
}
