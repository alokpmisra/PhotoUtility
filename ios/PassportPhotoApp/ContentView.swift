import SwiftUI
import UIKit

/// Core loop only, for now: capture/pick a photo, crop it to the US
/// passport spec, run on-device Vision segmentation to replace the
/// background with white, then save. The web app (repo root) still has
/// the full feature set (all size specs, compliance scoring, auto-fix,
/// print sheets) — this native build exists specifically to validate
/// whether Vision's segmentation quality is worth porting the rest.
enum AppScreen {
    case start
    case crop(UIImage)
    case export(UIImage)
}

struct ContentView: View {
    @State private var screen: AppScreen = .start

    var body: some View {
        Group {
            switch screen {
            case .start:
                StartView { image in
                    screen = .crop(image)
                }
            case .crop(let image):
                CropView(sourceImage: image, spec: .usPassport) { cropped in
                    screen = .export(cropped)
                } onCancel: {
                    screen = .start
                }
            case .export(let image):
                ExportView(croppedImage: image) {
                    screen = .start
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
