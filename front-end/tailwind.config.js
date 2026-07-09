/** @type {import('tailwindcss').Config} */

// TODO: ajustar cores, fontes e demais tokens de design conforme identidade visual da 3S Engenharia
// Documentação: https://tailwindcss.com/docs/configuration

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // TODO: definir paleta de cores da marca
      // colors: {
      //   primary: "",
      //   secondary: "",
      // },

      // TODO: definir tipografia
      // fontFamily: {
      //   sans: [],
      // },
    },
  },
  plugins: [
    // TODO: avaliar plugins como @tailwindcss/forms, @tailwindcss/typography
  ],
};

