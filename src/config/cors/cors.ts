import cors from 'cors'

export const corsConfig = () => {
  return cors({
    origin: '*',
    optionsSuccessStatus: 200,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization', 'X-Total-Count'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    preflightContinue: false,
    maxAge: 600,
    // secure: true, // Uncomment if using HTTPS
    // httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Uncomment if using HTTPS
    // originWhitelist: ['https://example.com'], // Uncomment if using a specific origin whitelist
    // allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Uncomment if using a specific header whitelist
    // exposedHeaders: ['Authorization', 'X-Total-count'], // Uncomment if using exposed headers
    // methods
  })
}