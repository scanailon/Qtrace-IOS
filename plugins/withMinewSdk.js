const {
  withXcodeProject,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const FRAMEWORK_SRC = path.join(
  __dirname,
  '..',
  'sdkMinew',
  'MinewSensorKitForV3',
  'MTSensorV3KitDemo',
  'MTSensorV3Kit.framework'
);

const NATIVE_SRC = path.join(__dirname, '..', 'ios_native');

const NATIVE_FILES = ['MinewBleModule.swift', 'MinewBleModule.m'];

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

      // Copy native bridge files -> ios/<ProjectName>/
      const targetDir = path.join(iosDir, projectName);
      for (const file of NATIVE_FILES) {
        fs.copyFileSync(path.join(NATIVE_SRC, file), path.join(targetDir, file));
      }

      // Create Bridging Header if missing
      const bridgingHeaderPath = path.join(targetDir, `${projectName}-Bridging-Header.h`);
      if (!fs.existsSync(bridgingHeaderPath)) {
        fs.writeFileSync(
          bridgingHeaderPath,
          '#import <React/RCTBridgeModule.h>\n#import <React/RCTEventEmitter.h>\n'
        );
      }

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
        if (fileRef) {
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

const withMinewSdk = (config) => {
  config = withMinewFiles(config);
  config = withMinewXcode(config);
  return config;
};

module.exports = withMinewSdk;
