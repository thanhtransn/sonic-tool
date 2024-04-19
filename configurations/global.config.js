const path = require("path");
const fs = require("fs");

class EnvConfiguration {
  constructor() {
    this.config = null;
  }

  static setEnv() {
    this.config = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../config.json"), {
        encoding: "utf8",
      })
    );
    return;
  }

  static getEnv() {
    if (this.config) return this.config;
    this.setEnv();
    return this.config;
  }
}

module.exports = EnvConfiguration;
