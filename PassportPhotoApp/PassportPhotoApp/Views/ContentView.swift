import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = PassportPhotoViewModel()

    var body: some View {
        NavigationStack {
            Group {
                switch viewModel.step {
                case .upload:
                    ImagePickerView(viewModel: viewModel)
                case .crop:
                    ImageCropView(viewModel: viewModel)
                case .preview:
                    PassportPreviewView(viewModel: viewModel)
                case .export:
                    ExportView(viewModel: viewModel)
                }
            }
            .navigationTitle(navigationTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if viewModel.step != .upload {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { viewModel.reset() }
                    }
                }
            }
            .animation(.easeInOut, value: viewModel.step)
        }
    }

    private var navigationTitle: String {
        switch viewModel.step {
        case .upload:  return "Passport Photo"
        case .crop:    return "Crop"
        case .preview: return "Preview"
        case .export:  return "Export"
        }
    }
}
