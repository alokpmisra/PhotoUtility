import SwiftUI
import PhotosUI

struct ImagePickerView: View {
    @ObservedObject var viewModel: PassportPhotoViewModel
    @State private var pickerItem: PhotosPickerItem?

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            VStack(spacing: 12) {
                Image(systemName: "person.crop.rectangle.badge.plus")
                    .font(.system(size: 72))
                    .foregroundStyle(.blue)

                Text("Passport Photo Generator")
                    .font(.title2.bold())

                Text("Create a US passport-compliant photo\nin seconds.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 16) {
                PhotosPicker(selection: $pickerItem, matching: .images) {
                    Label("Choose from Library", systemImage: "photo.on.rectangle")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .onChange(of: pickerItem) { _, item in
                    viewModel.handlePickedItem(item)
                }

                Button {
                    // Camera capture handled via UIImagePickerController wrapper
                } label: {
                    Label("Take a Photo", systemImage: "camera")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)
            }
            .padding(.horizontal, 32)

            if let error = viewModel.errorMessage {
                Text(error)
                    .foregroundStyle(.red)
                    .font(.footnote)
                    .padding(.horizontal)
            }

            Spacer()

            requirementsFooter
        }
        .padding()
    }

    private var requirementsFooter: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("US Passport Photo Requirements")
                .font(.caption.bold())
                .foregroundStyle(.secondary)
            Group {
                Text("• 2×2 inches (600×600 px at 300 DPI)")
                Text("• White or off-white background")
                Text("• Face: 70–80% of frame height")
                Text("• Taken within the last 6 months")
            }
            .font(.caption2)
            .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }
}
