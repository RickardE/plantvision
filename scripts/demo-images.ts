/**
 * Simple illustrated product and room images for local development, demos and end-to-end
 * tests, so the app is usable without access to supplier image hosts. Rendered from SVG.
 */
import sharp from "sharp";

type Plant = { leaf: string; leafDark: string; shape: "round" | "tall" | "spiky" | "tree" };

function plantSvg({ leaf, leafDark, shape }: Plant) {
  const leaves: string[] = [];
  if (shape === "round") {
    for (let i = 0; i < 9; i++) {
      const angle = -150 + i * 15;
      leaves.push(
        `<ellipse cx="0" cy="-95" rx="34" ry="70" fill="${i % 2 ? leaf : leafDark}" transform="translate(200 330) rotate(${angle + 90})"/>`,
      );
    }
  } else if (shape === "tall") {
    leaves.push(`<rect x="195" y="120" width="10" height="220" fill="#6b4f2a"/>`);
    for (let i = 0; i < 8; i++) {
      const y = 110 + i * 26;
      const side = i % 2 ? 1 : -1;
      leaves.push(
        `<ellipse cx="${200 + side * 38}" cy="${y}" rx="44" ry="26" fill="${i % 3 ? leaf : leafDark}" transform="rotate(${side * 25} ${200 + side * 38} ${y})"/>`,
      );
    }
  } else if (shape === "spiky") {
    for (let i = 0; i < 7; i++) {
      const x = 150 + i * 17;
      leaves.push(
        `<path d="M${x} 340 Q${x + (i - 3) * 12} 200 ${x + (i - 3) * 20} ${70 + Math.abs(i - 3) * 30} Q${x + 10} 220 ${x + 16} 340 Z" fill="${i % 2 ? leaf : leafDark}"/>`,
      );
    }
  } else {
    leaves.push(`<rect x="193" y="170" width="14" height="170" fill="#7a5a36"/>`);
    leaves.push(`<circle cx="200" cy="140" r="95" fill="${leafDark}"/>`);
    leaves.push(`<circle cx="160" cy="120" r="60" fill="${leaf}"/><circle cx="245" cy="150" r="55" fill="${leaf}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#ffffff"/>${leaves.join("")}</svg>`;
}

function potSvg(color: string, shape: "cube" | "round" | "tall") {
  const body =
    shape === "cube"
      ? `<rect x="90" y="120" width="220" height="220" rx="8" fill="${color}"/><rect x="90" y="120" width="220" height="16" fill="#000" opacity="0.15"/>`
      : shape === "round"
        ? `<path d="M80 150 H320 L290 340 H110 Z" fill="${color}"/><rect x="72" y="138" width="256" height="22" rx="6" fill="${color}"/>`
        : `<path d="M130 60 H270 L255 350 H145 Z" fill="${color}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#ffffff"/>${body}</svg>`;
}

function roomSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200">
    <defs><linearGradient id="w" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#efe9df"/><stop offset="1" stop-color="#e2d9cb"/></linearGradient>
    <linearGradient id="f" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#b89a74"/><stop offset="1" stop-color="#8f7556"/></linearGradient></defs>
    <rect width="1600" height="820" fill="url(#w)"/><rect y="820" width="1600" height="380" fill="url(#f)"/>
    <rect x="160" y="160" width="420" height="520" fill="#cfe3ef" stroke="#fff" stroke-width="18"/>
    <line x1="370" y1="160" x2="370" y2="680" stroke="#fff" stroke-width="12"/>
    <rect x="820" y="640" width="560" height="200" rx="24" fill="#5c6b73"/><rect x="840" y="560" width="520" height="110" rx="30" fill="#6d7d86"/>
    <rect x="980" y="300" width="260" height="170" fill="#d9c9a8" stroke="#8a7a5c" stroke-width="10"/>
  </svg>`;
}

const toJpeg = (svg: string) => sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();

export const DEMO_PRODUCTS = [
  {
    article: "DEMO-P-001",
    name: "Monstera Deliciosa",
    botanical: "Monstera deliciosa",
    category: "vaxter",
    w: 70,
    h: 120,
    light: "medium",
    svg: () => plantSvg({ leaf: "#3f8f4f", leafDark: "#2f6e3c", shape: "round" }),
  },
  {
    article: "DEMO-P-002",
    name: "Ficus Lyrata",
    botanical: "Ficus lyrata",
    category: "vaxter",
    w: 45,
    h: 160,
    light: "high",
    svg: () => plantSvg({ leaf: "#4c9a52", leafDark: "#2e6b36", shape: "tall" }),
  },
  {
    article: "DEMO-P-003",
    name: "Sansevieria Laurentii",
    botanical: "Sansevieria trifasciata",
    category: "vaxter",
    w: 30,
    h: 80,
    light: "low",
    svg: () => plantSvg({ leaf: "#5c8f3e", leafDark: "#c9c26a", shape: "spiky" }),
  },
  {
    article: "DEMO-P-004",
    name: "Olivträd",
    botanical: "Olea europaea",
    category: "vaxter",
    w: 60,
    h: 150,
    light: "high",
    svg: () => plantSvg({ leaf: "#8aa37a", leafDark: "#6a855c", shape: "tree" }),
  },
  {
    article: "DEMO-K-001",
    name: "Architect Cube Svart",
    botanical: null,
    category: "krukor",
    w: 51,
    h: 52,
    light: null,
    svg: () => potSvg("#2b2b2b", "cube"),
  },
  {
    article: "DEMO-K-002",
    name: "Classico Rund Vit",
    botanical: null,
    category: "krukor",
    w: 50,
    h: 45,
    light: null,
    svg: () => potSvg("#f1efe9", "round"),
  },
  {
    article: "DEMO-K-003",
    name: "Hög Kruka Terrakotta",
    botanical: null,
    category: "krukor",
    w: 40,
    h: 75,
    light: null,
    svg: () => potSvg("#c0673f", "tall"),
  },
] as const;

export const renderDemoImage = (svg: string) => toJpeg(svg);
export const renderDemoRoom = () => toJpeg(roomSvg());
