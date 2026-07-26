import AVFoundation

enum AudioSessionManager {
    static func configureForSpeech() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playAndRecord, mode: .spokenAudio, options: [.duckOthers, .defaultToSpeaker])
            try session.setActive(true)
        } catch {
            print("AudioSessionManager: failed to configure session — \(error)")
        }
    }
}
