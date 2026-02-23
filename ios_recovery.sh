#!/usr/bin/env bash
set -euo pipefail

echo "== iOS Recovery Kit: START =="

cd ios

# 1) Podfile'ı geri yaz
cat > Podfile <<'RUBY'
platform :ios, '15.1'
use_frameworks! :linkage => :static
install! 'cocoapods', :deterministic_uuids => false

# Autolinking (Expo + RN)
require File.join(File.dirname(`node --print "require.resolve('expo/package.json')"`), "scripts/autolinking") rescue nil
require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods") rescue nil

require 'json'
podfile_properties = JSON.parse(File.read(File.join(__dir__, 'Podfile.properties.json'))) rescue {}
ENV['RCT_NEW_ARCH_ENABLED'] = '0' if podfile_properties['newArchEnabled'] == 'false'

# --- PRE_INSTALL: Firebase/GoogleUtilities modül + static framework
pre_install do |installer|
  installer.pod_targets.each do |pod|
    name = pod.name
    if %w[
      FirebaseCore FirebaseCoreInternal FirebaseInstallations
      FirebaseAnalytics FirebaseAuth FirebaseMessaging FirebaseFirestore
      GoogleUtilities GoogleAppMeasurement GTMSessionFetcher
      nanopb abseil
    ].any? { |p| name.start_with?(p) }
      def pod.build_type; Pod::BuildType.static_framework end
      pod.user_target_xcconfigs.each { |cfg| cfg.build_settings['DEFINES_MODULE'] = 'YES' }
      pod.user_target_xcconfigs.each { |cfg| cfg.build_settings['CLANG_ENABLE_MODULES'] = 'YES' }
    end
  end
end

target 'OkulPanel' do
  use_expo_modules! rescue nil

  config = (defined?(use_native_modules!) ? use_native_modules! : {})
  use_react_native!(
    :path => (config[:reactNativePath] || "../node_modules/react-native"),
    :hermes_enabled => true,
    :fabric_enabled => false,
    :app_path => "#{Pod::Config.instance.installation_root}/.."
  )

  # Görsel/AVIF
  pod 'SDWebImageAVIFCoder'
  pod 'libavif'
  pod 'GoogleUtilities', :modular_headers => true

  post_install do |installer|
    require 'fileutils'
    react_native_post_install(installer) if defined?(react_native_post_install)

    # --- Global derleme bayrakları (Yoga/C++/header yolları)
    installer.pods_project.targets.each do |t|
      t.build_configurations.each do |cfg|
        bs = cfg.build_settings
        bs['IPHONEOS_DEPLOYMENT_TARGET']   = '15.1'
        bs['CLANG_ENABLE_MODULES']         = 'YES'
        bs['DEFINES_MODULE']               = 'NO'
        bs['USE_HEADERMAP']                = 'YES'
        bs['ALWAYS_SEARCH_USER_PATHS']     = 'NO'
        bs['CLANG_CXX_LANGUAGE_STANDARD']  = 'gnu++17'
        bs['CLANG_CXX_LIBRARY']            = 'libc++'
        bs['GCC_PRECOMPILE_PREFIX_HEADER'] = 'NO'
        bs['GCC_PREFIX_HEADER']            = ''

        extra_headers = [
          '$(PODS_ROOT)/Headers/Public',
          '$(PODS_ROOT)/Headers/Private',
          '$(PODS_ROOT)/libaom', '$(PODS_ROOT)/libaom/**',
          '$(PODS_ROOT)/libavif','$(PODS_ROOT)/libavif/**'
        ]
        bs['HEADER_SEARCH_PATHS']      = ([bs['HEADER_SEARCH_PATHS']] + extra_headers + ['$(inherited)']).compact.uniq.join(' ')
        bs['USER_HEADER_SEARCH_PATHS'] = ([bs['USER_HEADER_SEARCH_PATHS']] + extra_headers + ['$(inherited)']).compact.uniq.join(' ')
      end
    end

    # --- react_runtime çakışması: jsitooling.modulemap temizle
    installer.pods_project.files.each do |f|
      f.remove_from_project if f.path.to_s.include?('React-jsitooling.modulemap')
    end
    Dir.glob('Pods/**/react_runtime/**/React-jsitooling.modulemap').each { |p| FileUtils.rm_f(p) }
    Dir.glob('Pods/Headers/**/react_runtime/**/React-jsitooling.modulemap').each { |p| FileUtils.rm_f(p) }

    # --- glog NO_THREADS
    installer.pod_targets.each do |pt|
      next unless pt.name == 'glog'
      pt.user_target_xcconfigs.each do |cfg|
        cfg.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = '$(inherited) GLOG_NO_THREADS=1 NO_THREADS=1'
        cfg.build_settings['OTHER_CFLAGS'] = '$(inherited) -DNO_THREADS'
      end
    end

    # --- libdav1d agresif kaynakları dışla
    if (t = installer.pods_project.targets.find { |x| x.name == 'libdav1d' })
      t.build_configurations.each do |cfg|
        bs = cfg.build_settings
        bs['EXCLUDED_SOURCE_FILE_NAMES'] = 'asm/* *.asm *.S *.s recon_tmpl.c ipred_prepare.h cdef_apply.h lf_apply.h lr_apply.h'
      end
    end

    # --- libaom header path emniyeti
    if (t = installer.pods_project.targets.find { |x| x.name == 'libaom' })
      t.build_configurations.each do |cfg|
        bs = cfg.build_settings
        bs['HEADER_SEARCH_PATHS'] = ([bs['HEADER_SEARCH_PATHS']] + [
          '$(PODS_ROOT)/libaom','$(PODS_ROOT)/libaom/**',
          '$(PODS_ROOT)/libavif','$(PODS_ROOT)/libavif/**',
          '$(PODS_ROOT)/Headers/Public','$(PODS_ROOT)/Headers/Private','$(inherited)'
        ]).compact.uniq.join(' ')
      end
    end

    # --- libvmaf C++ standardı
    if (t = installer.pods_project.targets.find { |x| x.name == 'libvmaf' })
      t.build_configurations.each do |cfg|
        bs = cfg.build_settings
        bs['CLANG_CXX_LANGUAGE_STANDARD']  = 'gnu++17'
        bs['CLANG_CXX_LIBRARY']            = 'libc++'
        bs['GCC_PRECOMPILE_PREFIX_HEADER'] = 'NO'
        bs['GCC_PREFIX_HEADER']            = ''
      end
    end
  end
end
RUBY

# 2) .xcode.env sandbox fix
rm -f .xcode.env
printf "# dummy env\n" > .xcode.env
xattr -c .xcode.env || true

# 3) Expo config script dosyası varsa çalıştırılabilir yap
chmod +x "Pods/Target Support Files/Pods-OkulPanel/expo-configure-project.sh" 2>/dev/null || true

# 4) Temiz pod kurulumu
pod deintegrate || true
rm -rf Pods Podfile.lock
pod repo update
pod install

cd ..
# 5) DerivedData temizliği
rm -rf ~/Library/Developer/Xcode/DerivedData/* || true

echo "== iOS Recovery Kit: DONE =="
echo "Xcode'u aç → Scheme: OkulPanel (Release) → Any iOS Device (arm64) → Product > Clean Build Folder → Archive"
