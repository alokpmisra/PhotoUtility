import Foundation
import AVFoundation

/// Speaks a character's line out loud using that character's `VoiceProfile`
/// (pitch/rate), which is how Juniper and Birdy end up sounding different
/// from each other despite sharing one synthesizer.
@MainActor
final class JuniperVoiceSynthesizer: NSObject, ObservableObject {
    @Published private(set) var isSpeaking = false

    private let synthesizer = AVSpeechSynthesizer()

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    func speak(_ text: String, as character: CharacterProfile) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.pitchMultiplier = character.voice.pitch
        utterance.rate = character.voice.rate
        utterance.voice = AVSpeechSynthesisVoice(language: character.voice.language)
        synthesizer.speak(utterance)
    }

    func stopSpeaking() {
        synthesizer.stopSpeaking(at: .immediate)
    }
}

extension JuniperVoiceSynthesizer: AVSpeechSynthesizerDelegate {
    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        Task { @MainActor in self.isSpeaking = true }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in self.isSpeaking = false }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in self.isSpeaking = false }
    }
}
