import SwiftUI

struct TalkButton: View {
    let state: JuniperConversationViewModel.State
    let onPressDown: () -> Void
    let onPressUp: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: iconName)
                .font(.system(size: 40))
                .foregroundStyle(.white)
                .frame(width: 96, height: 96)
                .background(color, in: Circle())
                .scaleEffect(state == .listening ? 1.08 : 1.0)
                .animation(.easeInOut(duration: 0.3), value: state)

            Text(label)
                .font(.headline)
                .foregroundStyle(.secondary)
        }
        .gesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in onPressDown() }
                .onEnded { _ in onPressUp() }
        )
        .disabled(state == .thinking)
    }

    private var iconName: String {
        switch state {
        case .idle: return "mic.fill"
        case .listening: return "waveform"
        case .thinking: return "sparkles"
        case .speaking: return "speaker.wave.2.fill"
        }
    }

    private var color: Color {
        switch state {
        case .idle: return .orange
        case .listening: return .red
        case .thinking: return .purple
        case .speaking: return .blue
        }
    }

    private var label: String {
        switch state {
        case .idle: return "Hold to talk to Juniper"
        case .listening: return "Listening..."
        case .thinking: return "Juniper is thinking..."
        case .speaking: return "Juniper is talking..."
        }
    }
}
