import SwiftUI

/// Describes one member of Juniper's world so the rest of the app never
/// hardcodes "Juniper" or "Birdy" by name — new family/friends are added
/// purely as data in `JuniperFamily`.
struct CharacterProfile: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let role: String
    let homeworld: String
    let bio: String
    let catchphrases: [String]
    let voice: VoiceProfile
    let themeColorHex: String

    struct VoiceProfile: Codable, Equatable {
        /// AVSpeechUtterance pitch multiplier (0.5...2.0). Higher = squeakier/funnier.
        let pitch: Float
        /// AVSpeechUtterance rate (0.0...1.0, default ~0.5).
        let rate: Float
        /// BCP-47 language code for voice selection.
        let language: String
    }

    var themeColor: Color {
        Color(hex: themeColorHex)
    }
}

extension Color {
    init(hex: String) {
        let cleaned = hex.trimmingCharacters(in: .alphanumerics.inverted)
        var value: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&value)
        let r = Double((value >> 16) & 0xFF) / 255
        let g = Double((value >> 8) & 0xFF) / 255
        let b = Double(value & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
