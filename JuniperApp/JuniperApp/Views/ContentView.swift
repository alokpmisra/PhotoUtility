import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        TabView {
            NavigationStack {
                JuniperHomeView(modelContext: modelContext)
            }
            .tabItem { Label("Talk", systemImage: "bubble.left.and.bubble.right.fill") }

            NavigationStack {
                FamilyView()
            }
            .tabItem { Label("Crew", systemImage: "person.3.fill") }
        }
        .tint(JuniperFamily.juniper.themeColor)
    }
}

#Preview {
    ContentView()
        .modelContainer(for: LearnedFact.self, inMemory: true)
}
