const CleanCSS = require("clean-css");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "./public/": "/",
  });

  eleventyConfig.addFilter("cssmin", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });

  return {
    dir: {
      input: "content",
      includes: "../_includes",
      output: "_site"
    },
  }
};
