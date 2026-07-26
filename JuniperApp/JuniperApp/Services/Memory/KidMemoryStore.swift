import Foundation
import SwiftData

/// Persists what Juniper has learned about the kid across sessions and
/// extracts simple new facts from what the kid says. The extraction rules
/// here are intentionally lightweight — swap in something smarter later
/// without touching any other layer.
@MainActor
final class KidMemoryStore: ObservableObject {
    @Published private(set) var facts: [String: String] = [:]

    private let modelContext: ModelContext

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        reload()
    }

    func reload() {
        let descriptor = FetchDescriptor<LearnedFact>(sortBy: [SortDescriptor(\.dateLearned)])
        let stored = (try? modelContext.fetch(descriptor)) ?? []
        facts = Dictionary(stored.map { ($0.key, $0.value) }, uniquingKeysWith: { _, latest in latest })
    }

    func remember(key: String, value: String) {
        facts[key] = value
        modelContext.insert(LearnedFact(key: key, value: value))
        try? modelContext.save()
    }

    /// Looks for a handful of simple patterns a young child might say and
    /// turns them into remembered facts, e.g. "my name is Ava" -> name: Ava.
    func learnFromKidMessage(_ text: String) {
        let lowered = text.lowercased()

        if let name = Self.match(lowered, patterns: ["my name is ", "i'm ", "i am "]) {
            remember(key: "name", value: name.capitalized)
        }
        if let liked = Self.match(lowered, patterns: ["i like ", "i love "]) {
            remember(key: "likes", value: liked)
        }
    }

    private static func match(_ text: String, patterns: [String]) -> String? {
        for pattern in patterns {
            if let range = text.range(of: pattern) {
                let rest = text[range.upperBound...]
                    .trimmingCharacters(in: .whitespaces)
                    .split(separator: " ")
                    .prefix(3)
                    .joined(separator: " ")
                if !rest.isEmpty {
                    return rest
                }
            }
        }
        return nil
    }
}
