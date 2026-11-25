require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'CapgoCapacitorAdmob'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.homepage = package['repository']['url']
  s.author = package['author']
  s.source = { :git => package['repository']['url'], :tag => s.version.to_s }
  s.ios.deployment_target = '15.0'
  s.swift_version = '5.1'
  s.default_subspec = 'Core'

  s.subspec 'Core' do |core|
    core.source_files = 'ios/Sources/**/*.{swift,h,m,c,cc,mm,cpp}'
    core.dependency 'Capacitor'
    core.dependency 'Google-Mobile-Ads-SDK', '~> 13.1'
    core.dependency 'GoogleUserMessagingPlatform', '~> 3.1'
  end

  s.subspec 'Engine' do |engine|
    engine.dependency 'CapgoCapacitorAdmob/Core'
    engine.dependency 'WebViewNativeUIEngine', '1.0.11'
  end

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'ios/Tests/**/*.{swift,h,m,c,cc,mm,cpp}'
    test_spec.dependency 'CapgoCapacitorAdmob/Core'
  end
end