(function() {
    // properties
  
    const fs = require("fs");
    const xml2js = require("xml2js");
  
    // entry
    module.exports = {
      readXmlAsJson: readXmlAsJson
    };
  
    // read from xml file
    function readXmlAsJson(file) {
      let xmlData;
      let xmlParser;
      let parsedData;
  
      try {
        xmlData = fs.readFileSync(file);
        xmlParser = new xml2js.Parser();
        xmlParser.parseString(xmlData, (err, data) => {
          if (!err && data) {
            parsedData = data;
          }
        });
      } catch (err) {
        throw new Error(`Cannot read file ${file}`);
      }
  
      return parsedData;
    }

  })();