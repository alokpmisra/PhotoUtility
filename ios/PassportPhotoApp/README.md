# Passport Photo Converter — native iOS (core loop)

A native SwiftUI build created specifically to test whether Apple's Vision
framework produces meaningfully better background-removal quality than the
web app's small in-browser model. This is **not** feature-complete — it's
camera/upload → crop (US passport spec only) → Vision-based background
removal → save to Photos, so you can judge segmentation quality quickly.

The full-featured web app (all 8 size specs, compliance scoring, Auto-Fix,
print sheets) still lives at the repo root and is unaffected by this.

No `.xcodeproj` is included — Xcode project files are dense and easy to
get subtly wrong by hand with no way to verify them here, so creating a
fresh project in Xcode (which is always guaranteed correct) and adding
these files is the reliable path.

## Setup (~2 minutes)

1. **File → New → Project** → iOS → **App**.
   - Product Name: `PassportPhotoApp`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Uncheck "Use Core Data" / "Include Tests" (not needed)
2. Delete the auto-generated `ContentView.swift` that Xcode creates (we're
   replacing it).
3. Drag this `PassportPhotoApp` folder's contents into the Xcode project
   navigator (keep the `Models`, `Services`, `Views` groups) — check
   **"Copy items if needed"** and add to the app target.
4. Select the project in the navigator → your target → **Info** tab → add
   two keys under **Custom iOS Target Properties** (or use the **Signing &
   Capabilities**/**Info** build-settings UI, same result):
   - `Privacy - Camera Usage Description` (`NSCameraUsageDescription`) —
     e.g. "Used to take your passport photo."
   - `Privacy - Photo Library Additions Usage Description`
     (`NSPhotoLibraryAddUsageDescription`) — e.g. "Used to save your
     finished passport photo."
5. Set the deployment target to **iOS 15.0+** (Vision's
   `VNGeneratePersonSegmentationRequest` requires it) — target →
   **General** → Minimum Deployments.
6. Build and run on a **physical device** if possible — the simulator's
   camera won't work, so test the "Choose Photo" path there, or a real
   iPhone for the full camera flow.

## What to evaluate

Take (or pick) a photo, crop it, and look at the background-removed
result — specifically hair edges and shoulder edges, the two spots where
the web version struggled. If this is meaningfully cleaner, it's worth
porting the rest of the app's features (other size specs, compliance
scoring, Auto-Fix, print sheets) into this native build; if it's not a
big enough improvement to justify losing cross-platform reach, staying on
the web app (potentially with a better in-browser model) is the simpler
path.

## Project structure

```
PassportPhotoAppApp.swift   App entry point
ContentView.swift            Screen state machine (start → crop → export)
Models/PassportSpec.swift    Size spec (US passport only, for now)
Views/StartView.swift        Camera / photo library entry buttons
Views/ImagePicker.swift      UIImagePickerController bridge
Views/CropView.swift         Pan/zoom crop to the spec's aspect ratio
Views/ExportView.swift       Runs background removal, save to Photos
Services/BackgroundRemover.swift  Vision + Core Image background replacement
```
