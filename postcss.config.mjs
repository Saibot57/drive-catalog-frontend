/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}, // ADD THIS LINE - VERY IMPORTANT!
  },
};

export default config;