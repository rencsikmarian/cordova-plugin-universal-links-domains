(function () {
    // properties
  
    const configPreferences = require("../npm/processConfigXml.js");
    const iosAssociatedDomains = require("../ios/updateAssociatedDomains.js");
    const IOS = "ios";
    const ANDROID = "android";
  
    // entry
    module.exports = run;
  
    // builds before platform config
    function run(context) {
      const preferences = configPreferences.read(context);
      const platforms = context.opts.cordova.platforms;
  
      platforms.forEach(platform => {
        if (platform === ANDROID) {
          // TODO add the domains for the android too
        }
  
        if (platform === IOS) {
          iosAssociatedDomains.addAssociatedDomains(preferences);
        }
      });
    }
  })();