#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
IOS_DIR="$ROOT_DIR/ios"

echo "==> Fix iOS build: deep clean"
pkill -9 -f Xcode || true

cd "$IOS_DIR"
# İzinler
sudo chown -R "$(whoami)": staff "$ROOT_DIR" || true

# CocoaPods & cache
rm -rf Pods Podfile.lock *.xcworkspace
rm -rf ~/Library/Caches/CocoaPods
rm -rf ~/Library/Developer/Xcode/DerivedData

# Bundler
cd "$ROOT_DIR"
bundle config set path 'vendor/bundle'
bundle install

cd "$IOS_DIR"
echo "==> pod install (bundler ile)"
bundle exec pod repo update
bundle exec pod install --verbose

echo "==> Quick sanity: libdav1d build flags kontrol"
xcodebuild -project Pods/Pods.xcodeproj -target libdav1d -showBuildSettings \
  | egrep -i 'OTHER_CFLAGS|GCC_PREPROCESSOR_DEFINITIONS' | sed -n '1,200p' || true

echo "==> Ready. Xcode ile Archive/Run yapabilirsin."
