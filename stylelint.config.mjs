/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-standard"],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: ["mixin", "define-mixin", "for", "each", "if", "else"],
      },
    ],
    "selector-class-pattern": [
      "^[a-z][a-z0-9-]*(__[a-z][a-z0-9-]*)?(--[a-z][a-z0-9-]*)?$",
      { message: "Expected BEM class name (block__element--modifier)" },
    ],
  },
};
