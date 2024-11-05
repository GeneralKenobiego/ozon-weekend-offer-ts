import { defineConfig } from "cypress";

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: "https://dog.ceo",
    env: {
      yandexDiscConf: {
        baseUrl: "",
        token: "",
      },
    },
  },
});
