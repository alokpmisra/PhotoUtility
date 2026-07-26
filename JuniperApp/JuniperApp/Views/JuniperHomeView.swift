import SwiftUI
import SwiftData

struct JuniperHomeView: View {
    @Environment(\.modelContext) private var modelContext
    @StateObject private var viewModel: JuniperConversationViewModel
    @StateObject private var speechRecognizer: SpeechRecognizer
    @StateObject private var voiceSynthesizer: JuniperVoiceSynthesizer

    init(modelContext: ModelContext) {
        let recognizer = SpeechRecognizer()
        let synthesizer = JuniperVoiceSynthesizer()
        let memory = KidMemoryStore(modelContext: modelContext)

        _speechRecognizer = StateObject(wrappedValue: recognizer)
        _voiceSynthesizer = StateObject(wrappedValue: synthesizer)
        _viewModel = StateObject(wrappedValue: JuniperConversationViewModel(
            character: JuniperFamily.juniper,
            aiService: JuniperAIServiceFactory.makeService(),
            speechRecognizer: recognizer,
            voiceSynthesizer: synthesizer,
            memoryStore: memory
        ))
    }

    var body: some View {
        VStack(spacing: 24) {
            CharacterAvatarView(
                character: viewModel.character,
                isAnimating: voiceSynthesizer.isSpeaking
            )
            .padding(.top, 24)

            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: 10) {
                        if viewModel.messages.isEmpty {
                            Text("Say hi to \(viewModel.character.name)!")
                                .foregroundStyle(.secondary)
                                .padding(.top, 40)
                        }
                        ForEach(viewModel.messages) { message in
                            ConversationBubbleView(message: message)
                                .id(message.id)
                        }
                        if viewModel.state == .listening, !viewModel.liveTranscript.isEmpty {
                            ConversationBubbleView(
                                message: ConversationMessage(speaker: .kid, text: viewModel.liveTranscript, timestamp: .now)
                            )
                            .opacity(0.6)
                        }
                    }
                    .padding(.horizontal)
                }
                .onChange(of: viewModel.messages) { _, _ in
                    if let last = viewModel.messages.last {
                        withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
            }

            TalkButton(
                state: viewModel.state,
                onPressDown: { Task { await viewModel.startTalking() } },
                onPressUp: { Task { await viewModel.finishTalking() } }
            )
            .padding(.bottom, 24)
        }
        .alert("Uh oh!", isPresented: .constant(viewModel.errorMessage != nil), actions: {
            Button("OK") { viewModel.errorMessage = nil }
        }, message: {
            Text(viewModel.errorMessage ?? "")
        })
        .navigationTitle("Meet Juniper")
    }
}
