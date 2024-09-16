# Usa una imagen base ligera de Node.js
FROM node:18-alpine

# Instala pnpm globalmente
RUN npm install -g pnpm

# Establece el directorio de trabajo
WORKDIR /usr/src/app

ENV USER node

# Copia solo los archivos necesarios para instalar dependencias
COPY package*.json ./

# Establece la variable de entorno para el contenedor
ENV NODE_ENV=${NODE_ENV}

# Usa un argumento para decidir qué dependencias instalar
ARG NODE_ENV=development
RUN if [ "${NODE_ENV}" = "production" ]; then pnpm install --prod; else pnpm install; fi

# Copia el resto del código
COPY . .

# Compila el código TypeScript (si usas TypeScript)
RUN if [ "${NODE_ENV}" = "production" ]; then pnpm build && \ pnpm prune --production; fi

# Expone el puerto de la aplicación
EXPOSE 3000

USER $USER

# Comando para iniciar la aplicación en el entorno correcto
CMD if [ "${NODE_ENV}" = "production" ]; then pnpm start; else pnpm dev; fi
