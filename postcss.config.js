import postcssFor from "postcss-for";
import postcssMixins from "postcss-mixins";
import autoprefixer from "autoprefixer";

export default {
  plugins: [
    postcssFor,
    postcssMixins({
      mixins: {
        "port-cutout"(mixin, count) {
          const n = parseInt(count);
          const size = `${(100 / n).toFixed(4)}% 100%`;
          return {
            background: "unset",
            "background-image": Array(n).fill("var(--port-cutout)").join(", "),
            "background-size": Array(n).fill(size).join(", "),
            "background-position": Array.from({ length: n }, (_, i) =>
              i === 0 ? "0px 0px" : `${(i / (n - 1)) * 100}% 0px`
            ).join(", "),
            "background-repeat": "no-repeat",
          };
        },
      },
    }),
    autoprefixer,
  ],
};
