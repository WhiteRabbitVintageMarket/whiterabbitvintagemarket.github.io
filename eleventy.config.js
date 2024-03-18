const CleanCSS = require("clean-css");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "./public/": "/",
  });

  eleventyConfig.addFilter("cssmin", function (code) {
    return new CleanCSS({}).minify(code).styles;
  });

  eleventyConfig.addGlobalData("config", {
    apiBaseUrl: "https://white-rabbit-server.fly.dev",
    paypalSandboxClientId:
      "AUhhngQZuA196XU2_zVKjhX_fteqT__ww54meamPC7hLSgGlA8mZG0ig_6lDiJgUvCxP4Sxm2F6qBexC",
  });

  return {
    dir: {
      input: "content",
      includes: "../_includes",
      output: "_site",
    },
  };
};
