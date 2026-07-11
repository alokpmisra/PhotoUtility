import SwiftUI
import UIKit

struct StartView: View {
    var onImagePicked: (UIImage) -> Void

    @State private var showCamera = false
    @State private var showLibraryPicker = false

    var body: some View {
        VStack(spacing: 20) {
            Spacer()

            Text("Passport Photo Converter")
                .font(.title2.bold())
            Text("Capture or choose a photo to get started")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            VStack(spacing: 12) {
                Button {
                    showCamera = true
                } label: {
                    Label("Use Camera", systemImage: "camera")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                }
                .buttonStyle(.borderedProminent)
                .disabled(!UIImagePickerController.isSourceTypeAvailable(.camera))

                Button {
                    showLibraryPicker = true
                } label: {
                    Label("Choose Photo", systemImage: "photo.on.rectangle")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                }
                .buttonStyle(.bordered)
            }
            .padding(.horizontal, 32)
            .padding(.top, 8)

            Spacer()

            Text("All processing happens on this device — no photos are uploaded anywhere.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.bottom, 24)
        .sheet(isPresented: $showCamera) {
            ImagePicker(sourceType: .camera) { image in
                showCamera = false
                if let image {
                    onImagePicked(image)
                }
            }
            .ignoresSafeArea()
        }
        .sheet(isPresented: $showLibraryPicker) {
            ImagePicker(sourceType: .photoLibrary) { image in
                showLibraryPicker = false
                if let image {
                    onImagePicked(image)
                }
            }
            .ignoresSafeArea()
        }
    }
}

#Preview {
    StartView { _ in }
}
