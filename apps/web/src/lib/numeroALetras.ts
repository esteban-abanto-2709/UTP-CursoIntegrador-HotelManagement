const UNIDADES = [
  "",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciseis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
  "veintiuno",
  "veintidos",
  "veintitres",
  "veinticuatro",
  "veinticinco",
  "veintiseis",
  "veintisiete",
  "veintiocho",
  "veintinueve",
];

const DECENAS = [
  "",
  "",
  "",
  "treinta",
  "cuarenta",
  "cincuenta",
  "sesenta",
  "setenta",
  "ochenta",
  "noventa",
];

const CENTENAS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
];

function seccion(n: number): string {
  if (n === 100) return "cien";

  const centena = Math.floor(n / 100);
  const resto = n % 100;
  let texto = centena > 0 ? CENTENAS[centena] : "";

  if (resto > 0) {
    if (texto) texto += " ";
    if (resto < 30) {
      texto += UNIDADES[resto];
    } else {
      const decena = Math.floor(resto / 10);
      const unidad = resto % 10;
      texto += DECENAS[decena];
      if (unidad > 0) texto += ` y ${UNIDADES[unidad]}`;
    }
  }

  return texto;
}

function enteroALetras(n: number): string {
  if (n === 0) return "cero";

  const miles = Math.floor(n / 1000);
  const resto = n % 1000;
  let texto = "";

  if (miles > 0) {
    texto += miles === 1 ? "mil" : `${seccion(miles)} mil`;
  }
  if (resto > 0) {
    if (texto) texto += " ";
    texto += seccion(resto);
  }

  return texto;
}

export function numeroALetras(amount: number): string {
  const entero = Math.floor(amount + 1e-9);
  const centavos = Math.round((amount - entero) * 100);
  const palabras = enteroALetras(entero).toUpperCase();
  const cc = String(centavos).padStart(2, "0");
  return `${palabras} CON ${cc}/100 SOLES`;
}
