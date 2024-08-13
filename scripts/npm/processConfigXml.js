(function() {
    // properties
  
    const fs = require("fs");
    const path = require("path");
    const xmlHelper = require("../lib/xmlHelper.js");
  
    // entry
    module.exports = {
      read: read
    };
  
    // read config from config.xml
    function read(context) {
      const projectRoot = getProjectRoot(context);
      const configXml = getConfigXml(projectRoot);
      const domainConfigXml = getCustomDomainXml(configXml);
      const pluginPreferences = getPluginPreferences(
        context,
        configXml,
        domainConfigXml
      );
  
      return pluginPreferences;
    }
  
    // read config.xml
    function getConfigXml(projectRoot) {
      const pathToConfigXml = path.join(projectRoot, "config.xml");
      const configXml = xmlHelper.readXmlAsJson(pathToConfigXml);
  
      if (configXml == null) {
        throw new Error(
          "A config.xml is not found in project's root directory."
        );
      }
  
      return configXml;
    }
  
    // read <cordova-custom-domain-config> within config.xml
    function getCustomDomainXml(configXml) {
      const domainConfig = configXml.widget["cordova-custom-domain-config"];
  
      if (domainConfig == null || domainConfig.length === 0) {
        throw new Error(
          "<cordova-custom-domain-config> tag is not set in the config.xml."
        );
      }
  
      return domainConfig[0];
    }
  
    // read <cordova-custom-domain-config> properties within config.xml
    function getPluginPreferences(context, configXml, customDomainXml) {
      return {
        projectRoot: getProjectRoot(context),
        projectName: getProjectName(configXml),
        linkDomain: getLinkDomains(customDomainXml, "link-domain"),
        androidLinkDomain: getLinkDomains(customDomainXml, "android-link-domain"),
        iosLinkDomain: getLinkDomains(customDomainXml, "ios-link-domain"),
        iosProjectModule: getProjectModule(context),
      };
    }
  
    // read project root from cordova context
    function getProjectRoot(context) {
      return context.opts.projectRoot || null;
    }
  
    // read project name from config.xml
    function getProjectName(configXml) {
      let output = null;
      if (configXml.widget.hasOwnProperty("name")) {
        const name = configXml.widget.name[0];
        if (typeof name === "string") {
          output = configXml.widget.name[0];
        } else {
          output = configXml.widget.name[0]._;
        }
      }
  
      return output;
    }
  
    // read value from <cordova-custom-domain-config>
    // for multiple <link-domain>
    function getLinkDomains(domainConfigXml, key) {
      const output = [];
      if (domainConfigXml.hasOwnProperty(key)) {
        for (let i = 0; i < domainConfigXml[key].length; i++) {
          const item = domainConfigXml[key][i];
          output.push(item.$.value);
        }
      }
      return output;
    }
  
    // read iOS project module from cordova context
    function getProjectModule(context) {
      const projectRoot = getProjectRoot(context);
      const projectPath = path.join(projectRoot, "platforms", "ios");
  
      try {
        // pre 5.0 cordova structure
        return context
          .requireCordovaModule("cordova-lib/src/plugman/platforms")
          .ios.parseProjectFile(projectPath);
      } catch (e) {
        try {
          // pre 7.0 cordova structure
          return context
            .requireCordovaModule("cordova-lib/src/plugman/platforms/ios")
            .parseProjectFile(projectPath);
        } catch (e) {
          // post 7.0 cordova structure
          return getProjectModuleGlob(context);
        }
      }
    }

    function getProjectModuleGlob(context) {
        // get xcodeproj
        const projectRoot = getProjectRoot(context);
        const projectPath = path.join(projectRoot, "platforms", "ios");
        const projectFiles = require("glob")
          .sync(path.join(projectPath, "*.xcodeproj", "project.pbxproj"));
        if (projectFiles.length === 0) return;
        const pbxPath = projectFiles[0];
        const xcodeproj = require("xcode").project(pbxPath);
    
        // add hash
        xcodeproj.parseSync();
    
        // return xcodeproj and write method
        return {
          xcode: xcodeproj,
          write: function() {
            // save xcodeproj
            const fs = require("fs");
            fs.writeFileSync(pbxPath, xcodeproj.writeSync());
    
            // pull framework dependencies
            const frameworksFile = path.join(projectPath, "frameworks.json");
            let frameworks = {};
    
            try {
              frameworks = require(frameworksFile);
            } catch (e) {}
            // If there are no framework references, remove this file
            if (Object.keys(frameworks).length === 0) {
              return require("shelljs")
                .rm("-rf", frameworksFile);
            }
    
            // save frameworks
            fs.writeFileSync(frameworksFile, JSON.stringify(frameworks, null, 4));
          }
        };
      }
    
  
  })();