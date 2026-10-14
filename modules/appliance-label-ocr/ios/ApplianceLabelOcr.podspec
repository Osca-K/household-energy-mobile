Pod::Spec.new do |s|
  s.name = 'ApplianceLabelOcr'
  s.version = '1.0.0'
  s.summary = 'On-device bundled Latin appliance-label OCR'
  s.description = s.summary
  s.license = 'MIT'
  s.author = 'Household Energy'
  s.homepage = 'https://developers.google.com/ml-kit'
  s.source = { :path => '.' }
  s.platform = :ios, '16.4'
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.dependency 'GoogleMLKit/TextRecognition', '8.0.0'
  s.source_files = '**/*.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
