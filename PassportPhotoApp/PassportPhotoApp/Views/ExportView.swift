import SwiftUI

struct ExportView: View {
    @ObservedObject var viewModel: PassportPhotoViewModel
    @State private var showShareSheet = false
    @State private var saveStatus: SaveStatus?

    enum SaveStatus {
        case saving, success, failure(String)
    }

    var body: some View {
        VStack(spacing: 28) {
            Text("Export Passport Photo")
                .font(.title2.bold())
                .padding(.top, 24)

            if let image = viewModel.passportImage {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 180, height: 180)
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                    .shadow(color: .black.opacity(0.12), radius: 8, y: 4)
            }

            VStack(spacing: 14) {
                exportButton(
                    title: "Save to Photos",
                    subtitle: "Adds the image to your photo library",
                    icon: "photo.on.rectangle.angled",
                    action: saveToPhotos
                )

                exportButton(
                    title: "Share…",
                    subtitle: "AirDrop, Messages, Mail, and more",
                    icon: "square.and.arrow.up",
                    action: { showShareSheet = true }
                )
            }
            .padding(.horizontal)

            statusView

            Spacer()

            Button("Back to Preview") {
                viewModel.step = .preview
            }
            .buttonStyle(.bordered)
            .controlSize(.large)
            .padding(.bottom, 32)
        }
        .sheet(isPresented: $showShareSheet) {
            if let image = viewModel.passportImage {
                ShareSheet(items: [image])
            }
        }
    }

    @ViewBuilder
    private var statusView: some View {
        switch saveStatus {
        case .saving:
            ProgressView("Saving…")
        case .success:
            Label("Saved to Photos!", systemImage: "checkmark.circle.fill")
                .foregroundStyle(.green)
                .font(.subheadline.bold())
        case .failure(let msg):
            Text(msg)
                .foregroundStyle(.red)
                .font(.footnote)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        case nil:
            EmptyView()
        }
    }

    private func exportButton(title: String, subtitle: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.title2)
                    .frame(width: 36)
                    .foregroundStyle(.blue)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.body.bold())
                    Text(subtitle).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(.tertiary)
                    .font(.caption)
            }
            .padding()
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }

    private func saveToPhotos() {
        guard let image = viewModel.passportImage else { return }
        saveStatus = .saving
        ImageExporter.saveToPhotos(image) { result in
            DispatchQueue.main.async {
                switch result {
                case .success:
                    saveStatus = .success
                case .failure(let error):
                    saveStatus = .failure(error.localizedDescription)
                }
            }
        }
    }
}

// MARK: - Share Sheet wrapper

private struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uvc: UIActivityViewController, context: Context) {}
}
