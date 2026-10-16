import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';

/**
 * Base de datos real, en memoria.
 *
 * Las pruebas de integracion necesitan ejercitar mongoose de verdad: un mock
 * no prueba que los indices, los casts ni las consultas funcionan. Solo se
 * aísla el proceso, no el motor.
 */
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  // mongoose usa su propia conexion; hay que awaited para no dejar la suite colgando.
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  // Cada prueba arranca de una base limpia. Las colecciones quedan, los datos no.
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
