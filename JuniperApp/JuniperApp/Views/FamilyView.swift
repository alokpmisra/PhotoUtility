import SwiftUI

struct FamilyView: View {
    @StateObject private var voiceSynthesizer = JuniperVoiceSynthesizer()

    var body: some View {
        List(JuniperFamily.all) { character in
            Button {
                let line = character.catchphrases.randomElement() ?? character.bio
                voiceSynthesizer.speak(line, as: character)
            } label: {
                HStack(spacing: 16) {
                    CharacterAvatarView(character: character, size: 56)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(character.name)
                            .font(.headline)
                        Text(character.role)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text(character.bio)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                    }

                    Spacer()
                    Image(systemName: "speaker.wave.2.fill")
                        .foregroundStyle(character.themeColor)
                }
                .padding(.vertical, 4)
            }
            .buttonStyle(.plain)
        }
        .navigationTitle("Juniper's Family")
    }
}

#Preview {
    NavigationStack { FamilyView() }
}
