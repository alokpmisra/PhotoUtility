import SwiftUI
import PhotosUI

@MainActor
final class PassportPhotoViewModel: ObservableObject {
    @Published var selectedImage: UIImage?
    @Published var croppedImage: UIImage?
    @Published var passportImage: UIImage?
    @Published var errorMessage: String?
    @Published var step: AppStep = .upload

    enum AppStep {
        case upload, crop, preview, export
    }

    func handlePickedItem(_ item: PhotosPickerItem?) {
        guard let item else { return }
        Task {
            do {
                guard let data = try await item.loadTransferable(type: Data.self),
                      let image = UIImage(data: data) else {
                    errorMessage = "Could not load the selected image."
                    return
                }
                selectedImage = image
                step = .crop
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    func applyCrop(_ cropRect: CGRect) {
        guard let source = selectedImage,
              let cgImage = source.cgImage else { return }

        let scaleX = CGFloat(cgImage.width) / source.size.width
        let scaleY = CGFloat(cgImage.height) / source.size.height
        let scaled = CGRect(
            x: cropRect.origin.x * scaleX,
            y: cropRect.origin.y * scaleY,
            width: cropRect.width * scaleX,
            height: cropRect.height * scaleY
        )

        guard let cropped = cgImage.cropping(to: scaled) else { return }
        croppedImage = UIImage(cgImage: cropped, scale: source.scale, orientation: source.imageOrientation)
        generatePassportImage()
        step = .preview
    }

    private func generatePassportImage() {
        guard let source = croppedImage else { return }
        let size = PassportSpec.outputSizePx

        let renderer = UIGraphicsImageRenderer(size: size)
        passportImage = renderer.image { ctx in
            UIColor.white.setFill()
            ctx.fill(CGRect(origin: .zero, size: size))
            source.draw(in: CGRect(origin: .zero, size: size))
        }
    }

    func reset() {
        selectedImage = nil
        croppedImage = nil
        passportImage = nil
        errorMessage = nil
        step = .upload
    }
}
