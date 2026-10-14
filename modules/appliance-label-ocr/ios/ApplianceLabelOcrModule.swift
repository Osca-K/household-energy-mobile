import ExpoModulesCore
import UIKit
import MLKitVision
import MLKitTextRecognition

public class ApplianceLabelOcrModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ApplianceLabelOcr")
    AsyncFunction("recognizeText") { (uri: String, promise: Promise) in
      guard let url = URL(string: uri), url.isFileURL,
            let image = UIImage(contentsOfFile: url.path) else {
        promise.reject("OCR_IMAGE", "Could not open the label photo")
        return
      }
      let visionImage = VisionImage(image: image)
      visionImage.orientation = image.imageOrientation
      let recognizer = TextRecognizer.textRecognizer(options: TextRecognizerOptions())
      recognizer.process(visionImage) { result, error in
        if let error = error {
          promise.reject("OCR_FAILED", error.localizedDescription)
        } else if let result = result {
          promise.resolve(result.text)
        } else {
          promise.reject("OCR_EMPTY", "No text was recognised")
        }
      }
    }
  }
}
