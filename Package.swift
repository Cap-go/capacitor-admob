// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapgoCapacitorAdmob",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "CapgoCapacitorAdmob",
            targets: ["AdmobPlusPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0"),
        .package(url: "https://github.com/googleads/swift-package-manager-google-mobile-ads.git", from: "11.0.0")
    ],
    targets: [
        .target(
            name: "AdmobPlusPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "GoogleMobileAds", package: "swift-package-manager-google-mobile-ads")
            ],
            path: "ios/Sources/AdmobPlusPlugin"),
        .testTarget(
            name: "AdmobPlusPluginTests",
            dependencies: ["AdmobPlusPlugin"],
            path: "ios/Tests/AdmobPlusPluginTests")
    ]
)
