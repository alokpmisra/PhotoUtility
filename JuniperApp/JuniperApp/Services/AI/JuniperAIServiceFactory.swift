import Foundation

/// Picks the best AI backend available at runtime: Apple's on-device model
/// when the device supports it, otherwise the rule-based fallback.
enum JuniperAIServiceFactory {
    static func makeService() -> JuniperAIResponding {
        if #available(iOS 26.0, *), AppleIntelligenceAIService.isAvailable {
            return AppleIntelligenceAIService()
        }
        return FallbackJuniperAIService()
    }
}
