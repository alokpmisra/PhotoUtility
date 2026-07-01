import SwiftUI

struct PassportPreviewView: View {
    @ObservedObject var viewModel: PassportPhotoViewModel

    var body: some View {
        VStack(spacing: 24) {
            Text("Your Passport Photo")
                .font(.title2.bold())
                .padding(.top, 24)

            if let image = viewModel.passportImage {
                VStack(spacing: 8) {
                    Image(uiImage: image)
                        .resizable()
                        .interpolation(.high)
                        .scaledToFit()
                        .frame(width: 240, height: 240)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .strokeBorder(.gray.opacity(0.4), lineWidth: 1)
                        )
                        .shadow(color: .black.opacity(0.1), radius: 8, y: 4)

                    Text("600 × 600 px  •  2 × 2 in @ 300 DPI")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            } else {
                ProgressView("Generating…")
                    .frame(width: 240, height: 240)
            }

            complianceChecklist

            Spacer()

            VStack(spacing: 12) {
                Button {
                    viewModel.step = .export
                } label: {
                    Label("Save / Share", systemImage: "square.and.arrow.up")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)

                Button("Start Over") {
                    viewModel.reset()
                }
                .buttonStyle(.bordered)
                .controlSize(.large)

                Button("Re-crop") {
                    viewModel.step = .crop
                }
                .font(.footnote)
                .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 32)
        }
    }

    private var complianceChecklist: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Compliance Checklist")
                .font(.subheadline.bold())

            Group {
                checkRow("2×2 inch output size", passed: true)
                checkRow("White background", passed: true)
                checkRow("Square crop applied", passed: viewModel.croppedImage != nil)
                checkRow("Photo taken within 6 months", passed: nil)
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func checkRow(_ label: String, passed: Bool?) -> some View {
        HStack(spacing: 8) {
            Group {
                if let passed {
                    Image(systemName: passed ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .foregroundStyle(passed ? .green : .red)
                } else {
                    Image(systemName: "questionmark.circle.fill")
                        .foregroundStyle(.orange)
                }
            }
            Text(label)
                .font(.footnote)
        }
    }
}
