import SwiftUI
import SwiftData

@main
struct JuniperApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear { AudioSessionManager.configureForSpeech() }
        }
        .modelContainer(for: LearnedFact.self)
    }
}
