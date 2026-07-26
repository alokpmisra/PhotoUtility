import SwiftUI

struct CharacterAvatarView: View {
    let character: CharacterProfile
    var size: CGFloat = 160
    var isAnimating = false

    @State private var bounce = false

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [character.themeColor.opacity(0.9), character.themeColor.opacity(0.5)],
                        center: .center,
                        startRadius: 4,
                        endRadius: size / 2
                    )
                )
                .frame(width: size, height: size)

            Text(String(character.name.prefix(1)))
                .font(.system(size: size * 0.4, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
        }
        .offset(y: bounce ? -8 : 0)
        .animation(
            isAnimating ? .easeInOut(duration: 0.6).repeatForever(autoreverses: true) : .default,
            value: bounce
        )
        .onAppear { bounce = isAnimating }
        .onChange(of: isAnimating) { _, newValue in bounce = newValue }
        .accessibilityLabel(character.name)
    }
}

#Preview {
    CharacterAvatarView(character: JuniperFamily.juniper, isAnimating: true)
}
