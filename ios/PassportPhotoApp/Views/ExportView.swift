import SwiftUI
import UIKit
import Photos

struct ExportView: View {
    let croppedImage: UIImage
    var onStartOver: () -> Void

    @State private var resultImage: UIImage?
    @State private var isProcessing = true
    @State private var errorMessage: String?
    @State private var saveMessage: String?

    var body: some View {
        VStack(spacing: 16) {
            Spacer(minLength: 8)

            Group {
                if let resultImage {
                    Image(uiImage: resultImage)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 380)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.3)))
                } else if isProcessing {
                    VStack(spacing: 12) {
                        ProgressView()
                        Text("Removing background…")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .frame(height: 300)
                }
            }
            .padding(.horizontal)

            if let errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            if let saveMessage {
                Text(saveMessage)
                    .font(.footnote)
                    .foregroundStyle(.green)
            }

            Spacer()

            HStack {
                Button("Start Over", action: onStartOver)
                Spacer()
                Button {
                    saveToPhotos()
                } label: {
                    Label("Save to Photos", systemImage: "square.and.arrow.down")
                }
                .buttonStyle(.borderedProminent)
                .disabled(resultImage == nil)
            }
            .padding(.horizontal)
            .padding(.bottom)
        }
        .task {
            await process()
        }
    }

    private func process() async {
        let sourceImage = croppedImage
        do {
            // Vision's .accurate segmentation is a synchronous, CPU-bound
            // call — run it off the main thread so the UI doesn't freeze
            // while it works, then hop back for the state update.
            let output = try await Task.detached(priority: .userInitiated) {
                try BackgroundRemover.removeBackground(from: sourceImage)
            }.value
            resultImage = output
        } catch {
            errorMessage = "Could not remove background: \(error.localizedDescription) Showing the cropped photo without background removal instead."
            resultImage = croppedImage
        }
        isProcessing = false
    }

    private func saveToPhotos() {
        guard let resultImage else { return }
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            guard status == .authorized || status == .limited else {
                DispatchQueue.main.async {
                    saveMessage = "Photos access denied — enable it in Settings to save."
                }
                return
            }
            PHPhotoLibrary.shared().performChanges {
                PHAssetChangeRequest.creationRequestForAsset(from: resultImage)
            } completionHandler: { success, error in
                DispatchQueue.main.async {
                    saveMessage = success
                        ? "Saved to Photos."
                        : "Could not save: \(error?.localizedDescription ?? "unknown error")"
                }
            }
        }
    }
}

#Preview {
    ExportView(croppedImage: UIImage(systemName: "person.fill") ?? UIImage()) {}
}
