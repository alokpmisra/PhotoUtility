import SwiftUI

struct ConversationBubbleView: View {
    let message: ConversationMessage

    var body: some View {
        HStack {
            if isKid { Spacer(minLength: 40) }

            Text(message.text)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(bubbleColor, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .foregroundStyle(isKid ? .primary : .white)

            if !isKid { Spacer(minLength: 40) }
        }
    }

    private var isKid: Bool {
        if case .kid = message.speaker { return true }
        return false
    }

    private var bubbleColor: Color {
        switch message.speaker {
        case .kid: return Color(.systemGray5)
        case .character(let character): return character.themeColor
        }
    }
}
