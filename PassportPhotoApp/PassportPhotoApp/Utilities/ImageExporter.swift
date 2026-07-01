import UIKit

struct ImageExporter {
    /// Saves the image to the user's photo library.
    static func saveToPhotos(_ image: UIImage, completion: @escaping (Result<Void, Error>) -> Void) {
        UIImageWriteToSavedPhotosAlbum(image, Coordinator(completion: completion), #selector(Coordinator.saved(_:error:context:)), nil)
    }

    private final class Coordinator: NSObject {
        let completion: (Result<Void, Error>) -> Void
        init(completion: @escaping (Result<Void, Error>) -> Void) {
            self.completion = completion
        }

        @objc func saved(_ image: UIImage, error: Error?, context: UnsafeMutableRawPointer?) {
            if let error {
                completion(.failure(error))
            } else {
                completion(.success(()))
            }
        }
    }
}
