const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;
    const signingConfigs = "signingConfigs {";
    if (!gradle.includes(signingConfigs)) {
      throw new Error("Could not find Android signingConfigs in generated build.gradle");
    }

    gradle = gradle.replace(
      signingConfigs,
      `${signingConfigs}
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_FILE"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }`,
    );

    const releaseBuildType = gradle.indexOf("release {", gradle.indexOf("buildTypes {"));
    if (releaseBuildType < 0) {
      throw new Error("Could not find Android release build type in generated build.gradle");
    }
    const debugSigning = gradle.indexOf("signingConfig signingConfigs.debug", releaseBuildType);
    if (debugSigning < 0) {
      throw new Error("Could not find default Android release signing config");
    }
    gradle = `${gradle.slice(0, debugSigning)}signingConfig signingConfigs.release${gradle.slice(debugSigning + "signingConfig signingConfigs.debug".length)}`;
    mod.modResults.contents = gradle;
    return mod;
  });
};
