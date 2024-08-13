(function () {
    // properties
  
    const path = require("path");
    const fs = require("fs");
    const plist = require("plist");
    const mkpath = require("mkpath");
    // TODO [codinronan 15.01.2020]: Read these from {preferences.projectName}.plist --
    //  most people don't change them, but some do, and more importantly, some people add new ones!
    const BUILD_TYPES = ["Debug", "Release"];
    const ASSOCIATED_DOMAINS = "com.apple.developer.associated-domains";
  
    // entry
    module.exports = {
      addAssociatedDomains: addAssociatedDomains,
      updateAssociatedDomains: updateAssociatedDomains
    };
  
    // updates the associated domains from the link-domain field of the app's config.xml
    function addAssociatedDomains(preferences) {

      const files = getEntitlementFiles(preferences);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let entitlements = getEntitlements(file);
  
        entitlements = updateEntitlements(entitlements, preferences);
        setEntitlements(file, entitlements);
      }
    }
  
    // get the xcode .entitlements and provisioning profile .plist
    function getEntitlementFiles(preferences) {
      const files = [];
  
      for (let i = 0; i < BUILD_TYPES.length; i++) {
        const buildType = BUILD_TYPES[i];
        const plist = path.join(
          preferences.projectRoot,
          "platforms",
          "ios",
          preferences.projectName,
          `Entitlements-${buildType}.plist`
        );
        files.push(plist);
      }
  
      return files;
    }
  
    // save entitlements
    function setEntitlements(file, entitlements) {
      const plistContent = plist.build(entitlements);
  
      mkpath.sync(path.dirname(file));
  
      fs.writeFileSync(file, plistContent, "utf8");
    }
  
    // read entitlements
    function getEntitlements(file) {
      let content;
  
      try {
        content = fs.readFileSync(file, "utf8");
      } catch (err) {
        return {};
      }
  
      return plist.parse(content);
    }
  
    // appends link domains to the Associated Domain entitlement's file
    //    <dict>
    //      <key>com.apple.developer.associated-domains</key>
    //      <array>
    //        <string>applinks:rawsr.app.link</string>
    //        <string>applinks:rawsr-alternate.app.link</string>
    //      </array>
    //    </dict>
    function updateEntitlements(entitlements, preferences) {
      const domains = [];
      let prev = entitlements[ASSOCIATED_DOMAINS];
      const next = updateAssociatedDomains(preferences);
  
      const uniqueDomains = uniqueAssociatedDomains(domains.concat(prev, next));
      entitlements[ASSOCIATED_DOMAINS] = uniqueDomains;
  
      return entitlements;
    }
  
    function uniqueAssociatedDomains(domains) {
      var d = domains.concat();
      for (var i = 0; i < d.length; ++i) {
        for (var j = i + 1; j < d.length; ++j) {
          if (d[i] === d[j]) d.splice(j--, 1);
        }
      }
  
      return d;
    }
  
    // update Link Domains
    function updateAssociatedDomains(preferences) {
      const domainList = [];
      const prefix = "applinks:";
      const linkDomains = [...preferences.iosLinkDomain, ...preferences.linkDomain];
  
      for (let i = 0; i < linkDomains.length; i++) {
        // add link domain to associated domain
        domainList.push(prefix + linkDomains[i]);
      }
  
      return domainList;
    }
  })();