const {
  withXcodeProject,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const FRAMEWORK_SRC = path.join(
  __dirname,
  '..',
  'sdkMinew',
  'MinewSensorKitForV3',
  'MTSensorV3KitDemo',
  'MTSensorV3Kit.framework'
);

const NATIVE_SRC = path.join(__dirname, '..', 'ios_native');

const NATIVE_FILES = [
  'MinewBleModule.swift',
  'MinewBleModule.m',
  'MinewBleProxyDelegate.h',
  'MinewBleProxyDelegate.m',
];

// Copies a directory recursively
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Step 1: Copy files into the ios/ directory before Xcode project is modified
const withMinewFiles = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const iosDir = cfg.modRequest.platformProjectRoot;
      const projectName = cfg.modRequest.projectName;

      // Copy MTSensorV3Kit.framework -> ios/Frameworks/MTSensorV3Kit.framework
      const frameworkDest = path.join(iosDir, 'Frameworks', 'MTSensorV3Kit.framework');
      copyDir(FRAMEWORK_SRC, frameworkDest);

      // Convert binary plists inside the framework to XML so CocoaPods can read them
      execSync(`find "${frameworkDest}" -name "*.plist" -exec plutil -convert xml1 {} \\;`);

      // Copy native bridge files -> ios/<ProjectName>/
      const targetDir = path.join(iosDir, projectName);
      for (const file of NATIVE_FILES) {
        fs.copyFileSync(path.join(NATIVE_SRC, file), path.join(targetDir, file));
      }

      // Create/overwrite Bridging Header with React Native + MTSensorV3Kit imports
      const bridgingHeaderPath = path.join(targetDir, `${projectName}-Bridging-Header.h`);
      fs.writeFileSync(
        bridgingHeaderPath,
        '#import <React/RCTBridgeModule.h>\n#import <React/RCTEventEmitter.h>\n#import <MTSensorV3Kit/MTSensorV3Kit.h>\n#import "MinewBleProxyDelegate.h"\n'
      );

      return cfg;
    },
  ]);
};

// Step 2: Modify the Xcode project to link the framework and add source files
const withMinewXcode = (config) => {
  return withXcodeProject(config, async (cfg) => {
    const xcodeProject = cfg.modResults;
    const projectName = cfg.modRequest.projectName;

    const frameworkRelativePath = 'Frameworks/MTSensorV3Kit.framework';

    // --- Add framework to project ---
    // Check if already added
    const existingFramework = xcodeProject.pbxFileReferenceSection
      ? Object.values(xcodeProject.pbxFileReferenceSection()).find(
          (ref) => ref && ref.path && ref.path.includes('MTSensorV3Kit.framework')
        )
      : null;

    if (!existingFramework) {
      // Add framework file reference
      const frameworkFile = xcodeProject.addFramework(frameworkRelativePath, {
        customFramework: true,
        embed: true,
        sign: true,
        link: true,
      });
    }

    // --- Add native source files to the main target ---
    const groupKey = xcodeProject.findPBXGroupKey({ name: projectName });
    for (const file of NATIVE_FILES) {
      const filePath = `${projectName}/${file}`;
      const alreadyAdded = Object.values(xcodeProject.pbxFileReferenceSection() || {}).find(
        (ref) => ref && ref.path && ref.path.includes(file)
      );

      if (!alreadyAdded) {
        const fileRef = xcodeProject.addFile(filePath, groupKey, {});
        // Only .swift and .m files go to Compile Sources; headers do not.
        if (fileRef && !file.endsWith('.h')) {
          xcodeProject.addToPbxSourcesBuildPhase(fileRef);
        }
      }
    }

    // --- Set Swift Bridging Header build setting ---
    const targets = xcodeProject.pbxNativeTargetSection();
    for (const key of Object.keys(targets)) {
      const target = targets[key];
      if (!target || !target.buildConfigurationList) continue;

      const configListKey = target.buildConfigurationList;
      const configList = xcodeProject.pbxXCConfigurationList()[configListKey];
      if (!configList) continue;

      for (const buildConfigRef of configList.buildConfigurations || []) {
        const buildConfig =
          xcodeProject.pbxXCBuildConfigurationSection()[buildConfigRef.value];
        if (!buildConfig || !buildConfig.buildSettings) continue;

        const settings = buildConfig.buildSettings;

        // Set bridging header
        if (!settings.SWIFT_OBJC_BRIDGING_HEADER) {
          settings.SWIFT_OBJC_BRIDGING_HEADER = `"${projectName}/${projectName}-Bridging-Header.h"`;
        }

        // Ensure Swift version is set
        if (!settings.SWIFT_VERSION) {
          settings.SWIFT_VERSION = '5.0';
        }

        // Add Frameworks search path
        const frameworksDir = '$(PROJECT_DIR)/Frameworks';
        if (!settings.FRAMEWORK_SEARCH_PATHS) {
          settings.FRAMEWORK_SEARCH_PATHS = [`"${frameworksDir}"`];
        } else if (!settings.FRAMEWORK_SEARCH_PATHS.includes(frameworksDir)) {
          if (Array.isArray(settings.FRAMEWORK_SEARCH_PATHS)) {
            settings.FRAMEWORK_SEARCH_PATHS.push(`"${frameworksDir}"`);
          } else {
            settings.FRAMEWORK_SEARCH_PATHS = [
              settings.FRAMEWORK_SEARCH_PATHS,
              `"${frameworksDir}"`,
            ];
          }
        }
      }
    }

    return cfg;
  });
};

const withCxx20Podfile = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) {
        console.warn('[MinewSdk] Podfile not found at:', podfilePath);
        return cfg;
      }

      let content = fs.readFileSync(podfilePath, 'utf8');
      const marker = '# [MinewSdk] C++20 for fmt/FMT_STRING';
      if (content.includes(marker)) return cfg;

      // post_install is inside `target 'QTrace' do`. Its closing `end` is the
      // first `\n  end` (2-space indent) that appears after `post_install do`.
      const postInstallIdx = content.indexOf('post_install do |installer|');
      if (postInstallIdx === -1) {
        console.warn('[MinewSdk] post_install block not found in Podfile');
        return cfg;
      }

      const closingEndIdx = content.indexOf('\n  end', postInstallIdx);
      if (closingEndIdx === -1) {
        console.warn('[MinewSdk] closing end of post_install not found');
        return cfg;
      }

      const injection = [
        `    ${marker}`,
        '    installer.pods_project.targets.each do |target|',
        '      target.build_configurations.each do |config|',
        "        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'",
        "        config.build_settings['OTHER_CPLUSPLUSFLAGS'] = '$(inherited) -DFMT_USE_CONSTEVAL=0 -DFMT_USE_NONTYPE_TEMPLATE_ARGS=0'",
        '      end',
        '    end',
      ].join('\n');

      content = content.slice(0, closingEndIdx) + '\n' + injection + content.slice(closingEndIdx);
      fs.writeFileSync(podfilePath, content);
      console.log('[MinewSdk] Injected C++20 + FMT_USE_CONSTEVAL=0 into Podfile');
      return cfg;
    },
  ]);
};

const withMinewSdk = (config) => {
  config = withMinewFiles(config);
  config = withMinewXcode(config);
  config = withCxx20Podfile(config);
  return config;
};

module.exports = withMinewSdk;
