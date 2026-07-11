import Foundation

/// Mirrors the size-spec model in the web app's js/specs.js. Only the US
/// passport spec is wired up for this first native build; port the rest of
/// that list here once the core loop is validated.
struct PassportSpec {
    let id: String
    let name: String
    let widthMm: Double
    let heightMm: Double
    let dpi: Double

    var widthPx: Int { Int((widthMm / 25.4 * dpi).rounded()) }
    var heightPx: Int { Int((heightMm / 25.4 * dpi).rounded()) }

    static let usPassport = PassportSpec(
        id: "us-passport",
        name: "USA Passport / Visa (2×2 in)",
        widthMm: 50.8,
        heightMm: 50.8,
        dpi: 300
    )
}
