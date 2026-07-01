import SwiftUI

/// A simple square-crop UI. The user drags the crop handle to position
/// a fixed-ratio (1:1) crop box over their photo.
struct ImageCropView: View {
    @ObservedObject var viewModel: PassportPhotoViewModel
    @State private var cropOffset: CGSize = .zero
    @State private var dragOffset: CGSize = .zero
    @State private var cropSize: CGFloat = 0

    var body: some View {
        GeometryReader { geo in
            let side = min(geo.size.width, geo.size.height) * 0.75
            let _ = setCropSize(side)

            VStack(spacing: 0) {
                Text("Position your face in the box")
                    .font(.headline)
                    .padding(.top, 24)

                Spacer()

                ZStack {
                    if let image = viewModel.selectedImage {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .frame(width: geo.size.width)
                    }

                    cropOverlay(side: side, geo: geo)
                }

                Spacer()

                HStack(spacing: 20) {
                    Button("Back") {
                        viewModel.reset()
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)

                    Button("Use This Crop") {
                        commitCrop(displayWidth: geo.size.width)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                }
                .padding(.bottom, 32)
            }
        }
    }

    private func setCropSize(_ side: CGFloat) -> Bool {
        DispatchQueue.main.async {
            if cropSize == 0 { cropSize = side }
        }
        return true
    }

    private func cropOverlay(side: CGFloat, geo: GeometryProxy) -> some View {
        let totalOffset = CGSize(
            width: cropOffset.width + dragOffset.width,
            height: cropOffset.height + dragOffset.height
        )

        return RoundedRectangle(cornerRadius: 4)
            .strokeBorder(.white, lineWidth: 2)
            .frame(width: side, height: side)
            .overlay(cropGrid(side: side))
            .background(.black.opacity(0.001))
            .offset(totalOffset)
            .gesture(
                DragGesture()
                    .onChanged { value in dragOffset = value.translation }
                    .onEnded { value in
                        cropOffset.width += value.translation.width
                        cropOffset.height += value.translation.height
                        dragOffset = .zero
                    }
            )
    }

    private func cropGrid(side: CGFloat) -> some View {
        Canvas { ctx, size in
            let third = size.width / 3
            for i in 1...2 {
                let x = third * CGFloat(i)
                var vPath = Path()
                vPath.move(to: CGPoint(x: x, y: 0))
                vPath.addLine(to: CGPoint(x: x, y: size.height))
                ctx.stroke(vPath, with: .color(.white.opacity(0.4)), lineWidth: 0.5)

                var hPath = Path()
                hPath.move(to: CGPoint(x: 0, y: x))
                hPath.addLine(to: CGPoint(x: size.width, y: x))
                ctx.stroke(hPath, with: .color(.white.opacity(0.4)), lineWidth: 0.5)
            }
        }
        .frame(width: side, height: side)
    }

    private func commitCrop(displayWidth: CGFloat) {
        guard let image = viewModel.selectedImage else { return }

        let imageAspect = image.size.height / image.size.width
        let displayHeight = displayWidth * imageAspect
        let scaleX = image.size.width / displayWidth
        let scaleY = image.size.height / displayHeight

        let totalOffset = CGSize(
            width: cropOffset.width + dragOffset.width,
            height: cropOffset.height + dragOffset.height
        )

        // Crop box center in image coordinates
        let cx = (displayWidth / 2 + totalOffset.width) * scaleX
        let cy = (displayHeight / 2 + totalOffset.height) * scaleY
        let halfSide = (cropSize / 2) * scaleX

        let cropRect = CGRect(
            x: cx - halfSide,
            y: cy - halfSide,
            width: halfSide * 2,
            height: halfSide * 2
        ).intersection(CGRect(origin: .zero, size: image.size))

        viewModel.applyCrop(cropRect)
    }
}
