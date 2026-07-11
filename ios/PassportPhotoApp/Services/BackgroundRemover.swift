import UIKit
import Vision
import CoreImage

/// On-device background replacement using Apple's Vision framework person
/// segmentation (hardware-accelerated, iOS 15+). This is the whole reason
/// for the native pivot: VNGeneratePersonSegmentationRequest at .accurate
/// quality is a proper OS-maintained model, not a small web-friendly one,
/// so it should produce meaningfully cleaner edges/hair than the browser
/// version did.
enum BackgroundRemover {
    enum RemovalError: LocalizedError {
        case noCGImage
        case noResult
        case renderFailed

        var errorDescription: String? {
            switch self {
            case .noCGImage: return "Could not read the source image."
            case .noResult: return "No person was detected in the photo."
            case .renderFailed: return "Could not render the processed image."
            }
        }
    }

    static func removeBackground(from image: UIImage) throws -> UIImage {
        guard let cgImage = image.cgImage else { throw RemovalError.noCGImage }

        let request = VNGeneratePersonSegmentationRequest()
        request.qualityLevel = .accurate
        request.outputPixelFormat = kCVPixelFormatType_OneComponent8

        let handler = VNImageRequestHandler(
            cgImage: cgImage,
            orientation: cgOrientation(from: image.imageOrientation),
            options: [:]
        )
        try handler.perform([request])

        guard let result = request.results?.first else { throw RemovalError.noResult }

        let ciImage = CIImage(cgImage: cgImage)
        var maskImage = CIImage(cvPixelBuffer: result.pixelBuffer)

        // The mask is typically produced at a lower resolution than the
        // source photo; scale it up to match before compositing.
        let scaleX = ciImage.extent.width / maskImage.extent.width
        let scaleY = ciImage.extent.height / maskImage.extent.height
        maskImage = maskImage.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))

        let whiteBackground = CIImage(color: .white).cropped(to: ciImage.extent)

        guard let blendFilter = CIFilter(name: "CIBlendWithMask") else {
            throw RemovalError.renderFailed
        }
        blendFilter.setValue(ciImage, forKey: kCIInputImageKey)
        blendFilter.setValue(whiteBackground, forKey: kCIInputBackgroundImageKey)
        blendFilter.setValue(maskImage, forKey: kCIInputMaskImageKey)

        guard let blended = blendFilter.outputImage else { throw RemovalError.renderFailed }

        let context = CIContext()
        guard let outputCG = context.createCGImage(blended, from: ciImage.extent) else {
            throw RemovalError.renderFailed
        }

        return UIImage(cgImage: outputCG, scale: image.scale, orientation: .up)
    }

    private static func cgOrientation(from orientation: UIImage.Orientation) -> CGImagePropertyOrientation {
        switch orientation {
        case .up: return .up
        case .down: return .down
        case .left: return .left
        case .right: return .right
        case .upMirrored: return .upMirrored
        case .downMirrored: return .downMirrored
        case .leftMirrored: return .leftMirrored
        case .rightMirrored: return .rightMirrored
        @unknown default: return .up
        }
    }
}
