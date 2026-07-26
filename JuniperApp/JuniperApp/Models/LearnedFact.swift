import Foundation
import SwiftData

/// A small fact Juniper picked up about the kid ("name" -> "Ava", "likes" -> "dinosaurs").
/// Persisted so Juniper "remembers" across app launches — this is the app's learning loop.
@Model
final class LearnedFact {
    var key: String
    var value: String
    var dateLearned: Date

    init(key: String, value: String, dateLearned: Date = .now) {
        self.key = key
        self.value = value
        self.dateLearned = dateLearned
    }
}
