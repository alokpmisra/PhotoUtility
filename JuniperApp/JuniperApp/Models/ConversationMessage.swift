import Foundation

struct ConversationMessage: Identifiable, Equatable {
    enum Speaker: Equatable {
        case kid
        case character(CharacterProfile)
    }

    let id = UUID()
    let speaker: Speaker
    let text: String
    let timestamp: Date

    static func == (lhs: ConversationMessage, rhs: ConversationMessage) -> Bool {
        lhs.id == rhs.id
    }
}
