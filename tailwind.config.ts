import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"], // Use shadcn dark mode
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    "../../packages/ui/src/**/*.{ts,tsx}",
	],
  prefix: "", // Keep shadcn prefix
  theme: {
    container: { // Keep shadcn container
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px", // Keep shadcn 2xl
      },
    },
    extend: {
      // Add Horizon UI extensions
      width: {
        '1p': '1%', '2p': '2%', '3p': '3%', '4p': '4%', '5p': '5%', '6p': '6%', '7p': '7%', '8p': '8%', '9p': '9%',
        '10p': '10%', '11p': '11%', '12p': '12%', '13p': '13%', '14p': '14%', '15p': '15%', '16p': '16%', '17p': '17%', '18p': '18%', '19p': '19%',
        '20p': '20%', '21p': '21%', '22p': '22%', '23p': '23%', '24p': '24%', '25p': '25%', '26p': '26%', '27p': '27%', '28p': '28%', '29p': '29%',
        '30p': '30%', '31p': '31%', '32p': '32%', '33p': '33%', '34p': '34%', '35p': '35%', '36p': '36%', '37p': '37%', '38p': '38%', '39p': '39%',
        '40p': '40%', '41p': '41%', '42p': '42%', '43p': '43%', '44p': '44%', '45p': '45%', '46p': '46%', '47p': '47%', '48p': '48%', '49p': '49%',
        '50p': '50%', '51p': '51%', '52p': '52%', '53p': '53%', '54p': '54%', '55p': '55%', '56p': '56%', '57p': '57%', '58p': '58%', '59p': '59%',
        '60p': '60%', '61p': '61%', '62p': '62%', '63p': '63%', '64p': '64%', '65p': '65%', '66p': '66%', '67p': '67%', '68p': '68%', '69p': '69%',
        '70p': '70%', '71p': '71%', '72p': '72%', '73p': '73%', '74p': '74%', '75p': '75%', '76p': '76%', '77p': '77%', '78p': '78%', '79p': '79%',
        '80p': '80%', '81p': '81%', '82p': '82%', '83p': '83%', '84p': '84%', '85p': '85%', '86p': '86%', '87p': '87%', '88p': '88%', '89p': '89%',
        '90p': '90%', '91p': '91%', '92p': '92%', '93p': '93%', '94p': '94%', '95p': '95%', '96p': '96%', '97p': '97%', '98p': '98%', '99p': '99%',
      },
      fontFamily: {
        sans: ["var(--font-sans)", "DM Sans", "sans-serif"], // Keep existing sans, add DM Sans as fallback
        poppins: ['Poppins', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'], // Explicitly add DM Sans
      },
      boxShadow: {
        '3xl': '14px 17px 40px 4px rgba(112, 144, 176, 0.08)', // Adjusted alpha for better compatibility
        inset: 'inset 0px 18px 22px rgba(0, 0, 0, 0.1)', // Simplified inset shadow
        darkinset: '0px 4px 4px inset rgba(0, 0, 0, 0.2)', // Simplified dark inset shadow
        'horizon-100': 'var(--shadow-100)', // Define --shadow-100 in globals.css if needed
        'horizon-500': 'rgba(112, 144, 176, 0.08)',
      },
      backgroundImage: {
        // Add Horizon background images (adjust paths if necessary)
        // ballanceDashboard: "url('/img/dashboards/balanceImg.png')",
        // ... other background images ...
      },
      colors: {
        // Keep existing shadcn colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        // Add Horizon specific colors (prefixed)
        lightPrimary: '#F4F7FE',
        blueSecondary: '#4318FF',
        brandLinear: '#868CFF',
        horizonGray: {
          50: '#F5F6FA', 100: '#EEF0F6', 200: '#DADEEC', 300: '#C9D0E3', 400: '#B0BBD5',
          500: '#B5BED9', 600: '#A3AED0', 700: '#707eae', 800: '#2D396B', 900: '#1B2559',
        },
        navy: {
          50: '#d0dcfb', 100: '#aac0fe', 200: '#a3b9f8', 300: '#728fea', 400: '#3652ba',
          500: '#1b3bbb', 600: '#24388a', 700: '#1B254B', 800: '#111c44', 900: '#0b1437',
        },
        horizonRed: {
          50: '#ee5d501a', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171',
          500: '#f53939', 600: '#ea0606', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d',
        },
        horizonOrange: {
           50: '#FFF7EB', 100: '#FFF1DB', 200: '#FFE2B8', 300: '#FFD28F', 400: '#FFC46B',
           500: '#FFB547', 600: '#FF9B05', 700: '#C27400', 800: '#855000', 900: '#422800',
           950: '#1F1200',
        },
        horizonGreen: {
           50: '#E1FFF4', 100: '#BDFFE7', 200: '#7BFECE', 300: '#39FEB6', 400: '#01F99E',
           500: '#01B574', 600: '#01935D', 700: '#016B44', 800: '#00472D', 900: '#002417',
        },
        horizonTeal: {
           50: '#EBFAF8', 100: '#D7F4F2', 200: '#AAE9E4', 300: '#82DED6', 400: '#59D4C9',
           500: '#33C3B7', 600: '#299E94', 700: '#1F756E', 800: '#144D48', 900: '#0B2826',
           950: '#051413',
        },
        horizonCyan: {
           50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#21d4fd',
           500: '#17c1e8', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63',
        },
        horizonBlue: {
           50: '#EBEFFF', 100: '#D6DFFF', 200: '#ADBFFF', 300: '#8AA3FF', 400: '#6183FF',
           500: '#3965FF', 600: '#0036FA', 700: '#0029BD', 800: '#001B7A', 900: '#000D3D',
           950: '#00071F',
        },
        horizonPurple: {
           50: '#EFEBFF', 100: '#E9E3FF', 200: '#422AFB', 300: '#422AFB', 400: '#7551FF',
           500: '#422AFB', 600: '#3311DB', 700: '#02044A', 800: '#190793', 900: '#11047A',
        },
        horizonPink: {
           50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6',
           500: '#ff0080', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843',
        },
        // Horizon variable colors (ensure CSS variables are defined)
        horizonBackground: { // Renamed from background to avoid conflict
          100: 'var(--background-100)',
          900: 'var(--background-900)',
        },
        brand: { // Renamed from brand to avoid conflict
          50: 'var(--color-50)', 100: 'var(--color-100)', 200: 'var(--color-200)',
          300: 'var(--color-300)', 400: 'var(--color-400)', 500: 'var(--color-500)',
          600: 'var(--color-600)', 700: 'var(--color-700)', 800: 'var(--color-800)',
          900: 'var(--color-900)',
        },
      },
      borderRadius: { // Keep shadcn border radius
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: { // Keep shadcn keyframes
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: { // Keep shadcn animations
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
    // Add Horizon screens (merged with shadcn where possible)
    screens: {
      sm: '576px',
      'sm-max': { max: '576px' },
      md: '768px',
      'md-max': { max: '768px' },
      lg: '992px',
      'lg-max': { max: '992px' },
      xl: '1200px',
      'xl-max': { max: '1200px' },
      '2xl': '1400px', // Keep shadcn 2xl
      '2xl-max': { max: '1320px' }, // Horizon's max value
      '3xl': '1600px',
      '3xl-max': { max: '1600px' },
      '4xl': '1850px',
      '4xl-max': { max: '1850px' },
    },
  },
  plugins: [require("tailwindcss-animate"), require('tailwindcss-rtl')], // Keep animate, add rtl
}

export default config 