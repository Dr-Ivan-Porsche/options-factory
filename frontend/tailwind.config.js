/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    fontFamily: {
      'ethica': ['lft-etica-mono']
    },
    screens: {
      sm: "480px",
      md: "768px",
      lg: "976px",
      dt: "1080px",
    },
    backgroundSize: {
      auto: "auto",
      cover: "cover",
      contain: "contain",
      "110%": "110%",
      "120%": "120%",
    },
    rotate: {
      30: "30deg",
      r30: "-30deg",
      60: "60deg",
      r60: "-60deg",
      90: "90deg",
      r90: "-90deg",
      120: "120deg",
      r120: "-120deg",
      150: "150deg",
      r150: "-150deg",
      180: "180deg",
      r180: "-180deg",
    },
    extend: {
      animation: {
        'toast-appear': 'toast-appear 200ms',
      },
      keyframes: {
        'toast-appear': {
          '0%': {
            top: 0,
            opacity: 0,
          },
          '100%': {
            opacity: 1,
          }
        }
      },
      flex: {
        2: "2 2 0%",
      },
      colors: {
        primary: "#1f2929",
        skyblue: "#06f7f7",
        darkskyblue: "#06e6e6",
        black: "#272929",
        black2: "#192121",
        black3: "#131a1a",
        black4: "#0f1414",
        darkgray: "#252e2e",
        gray: "#c7ccdb",
        dove: "#d1d6e6",
        green: "#52b35d",
        red: "#e65c5c",
        darkred: "#a34848",

        darkgreen: "#1f3b3d",
        jade: "#08555c",
      },
      boxShadow: {
        "button-primary": "inset 25rem 0 0 0 #d1f52c",
        "button-white2": "inset 25rem 0 0 0 #e6e6e6",
        "button-red": "inset 25rem 0 0 0 #e03c1b",
        "button-disabled": "inset 25rem 0 0 0 #d1f52c",
      },
      transitionProperty: {
        width: "width",
        opacity: "opacity",
      }
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
