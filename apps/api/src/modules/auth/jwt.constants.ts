const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error(
    'JWT_SECRET no está definido. Configúralo en el entorno antes de arrancar la API.',
  );
}

export const JWT_SECRET = jwtSecret;
