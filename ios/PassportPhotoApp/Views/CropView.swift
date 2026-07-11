import SwiftUI
import UIKit

/// Pan-and-zoom crop within a fixed-aspect frame matching `spec`. Renders
/// the final crop at the spec's true pixel dimensions via
/// UIGraphicsImageRenderer so the export is exact, not a screenshot of the
/// preview.
struct CropView: View {
    let sourceImage: UIImage
    let spec: PassportSpec
    var onCropped: (UIImage) -> Void
    var onCancel: () -> Void

    @State private var scale: CGFloat = 1
    @State private var lastScale: CGFloat = 1
    @State private var offset: CGSize = .zero
    @State private var lastOffset: CGSize = .zero
    @State private var previewFrameSize: CGSize = CGSize(width: 1, height: 1)

    private var aspect: CGFloat {
        CGFloat(spec.widthPx) / CGFloat(spec.heightPx)
    }

    var body: some View {
        VStack(spacing: 16) {
            Text(spec.name)
                .font(.headline)
                .padding(.top)

            Text("Drag to reposition, pinch to zoom")
                .font(.caption)
                .foregroundStyle(.secondary)

            GeometryReader { geo in
                let frameSize = computeFrameSize(in: geo.size)

                ZStack {
                    Image(uiImage: sourceImage)
                        .resizable()
                        .scaledToFill()
                        .frame(width: frameSize.width, height: frameSize.height)
                        .scaleEffect(scale)
                        .offset(offset)
                }
                .frame(width: frameSize.width, height: frameSize.height)
                .clipShape(Rectangle())
                .overlay(Rectangle().stroke(Color.white, lineWidth: 2))
                .shadow(radius: 4)
                .position(x: geo.size.width / 2, y: geo.size.height / 2)
                .gesture(
                    SimultaneousGesture(
                        MagnificationGesture()
                            .onChanged { value in
                                scale = max(1, lastScale * value)
                            }
                            .onEnded { _ in
                                lastScale = scale
                            },
                        DragGesture()
                            .onChanged { value in
                                offset = CGSize(
                                    width: lastOffset.width + value.translation.width,
                                    height: lastOffset.height + value.translation.height
                                )
                            }
                            .onEnded { _ in
                                lastOffset = offset
                            }
                    )
                )
                .onAppear {
                    previewFrameSize = frameSize
                }
                .onChange(of: geo.size) { _ in
                    previewFrameSize = computeFrameSize(in: geo.size)
                }
            }
            .aspectRatio(aspect, contentMode: .fit)
            .padding()

            HStack {
                Button("Back", role: .cancel, action: onCancel)
                Spacer()
                Button("Continue") {
                    onCropped(renderCrop())
                }
                .buttonStyle(.borderedProminent)
            }
            .padding(.horizontal)
            .padding(.bottom)
        }
    }

    private func computeFrameSize(in containerSize: CGSize) -> CGSize {
        guard containerSize.width > 0, containerSize.height > 0 else {
            return CGSize(width: 1, height: 1)
        }
        let width = containerSize.width
        let height = width / aspect
        if height > containerSize.height {
            let h = containerSize.height
            return CGSize(width: h * aspect, height: h)
        }
        return CGSize(width: width, height: height)
    }

    private func renderCrop() -> UIImage {
        let targetSize = CGSize(width: spec.widthPx, height: spec.heightPx)
        let renderer = UIGraphicsImageRenderer(size: targetSize)

        return renderer.image { _ in
            UIColor.white.setFill()
            UIRectFill(CGRect(origin: .zero, size: targetSize))

            let imgSize = sourceImage.size
            let baseScale = max(targetSize.width / imgSize.width, targetSize.height / imgSize.height)
            let totalScale = baseScale * scale
            let drawnSize = CGSize(width: imgSize.width * totalScale, height: imgSize.height * totalScale)

            // Convert the on-screen preview offset (measured in the
            // preview frame's point space) into export-pixel space.
            let frameToExport = targetSize.width / max(previewFrameSize.width, 1)
            let exportOffsetX = offset.width * frameToExport
            let exportOffsetY = offset.height * frameToExport

            let originX = (targetSize.width - drawnSize.width) / 2 + exportOffsetX
            let originY = (targetSize.height - drawnSize.height) / 2 + exportOffsetY

            sourceImage.draw(in: CGRect(origin: CGPoint(x: originX, y: originY), size: drawnSize))
        }
    }
}

#Preview {
    CropView(sourceImage: UIImage(systemName: "person.fill") ?? UIImage(), spec: .usPassport) { _ in } onCancel: {}
}
