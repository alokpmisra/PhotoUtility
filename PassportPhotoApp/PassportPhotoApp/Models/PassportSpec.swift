import CoreGraphics

enum PassportSpec {
    // US passport photo: 2×2 inches at 300 DPI
    static let outputSizePx = CGSize(width: 600, height: 600)

    // Face height must be 70–80% of the frame (420–480 px of 600)
    static let faceHeightRange: ClosedRange<CGFloat> = 0.70...0.80

    // Background color: white / off-white
    static let backgroundColor = CGColor(red: 1, green: 1, blue: 1, alpha: 1)
}
