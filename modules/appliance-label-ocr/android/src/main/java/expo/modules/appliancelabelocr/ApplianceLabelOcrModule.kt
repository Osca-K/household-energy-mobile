package expo.modules.appliancelabelocr

import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ApplianceLabelOcrModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ApplianceLabelOcr")
    AsyncFunction("recognizeText") { uri: String, promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.reject("OCR_CONTEXT", "Camera context is unavailable", null)
      } else {
        try {
          val parsed = Uri.parse(uri)
          require(parsed.scheme == "file" || parsed.scheme == "content") { "Only local photos are supported" }
          val image = InputImage.fromFilePath(context, parsed)
          val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
          recognizer.process(image)
            .addOnSuccessListener { result -> promise.resolve(result.text) }
            .addOnFailureListener { error -> promise.reject("OCR_FAILED", "Could not read the label", error) }
            .addOnCompleteListener { recognizer.close() }
        } catch (error: Exception) {
          promise.reject("OCR_IMAGE", "Could not open the label photo", error)
        }
      }
    }
  }
}
