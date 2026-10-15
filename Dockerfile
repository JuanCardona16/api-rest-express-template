# syntax=docker/dockerfile:1

# Imagen glibc, no alpine: bcrypt distribuye binarios precompilados solo para
# glibc. En alpine hay que instalar toolchain de compilacion y compilarlo en cada
# build, y sale mas caro que el espacio que ahorra la imagen.
FROM node:20-slim AS base

# pnpm viene del proyecto, no de un npm install -g que se desincroniza del lockfile.
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

# ---------------------------------------------------------------------------
# deps: instalacion completa, necesaria para construir.
# ---------------------------------------------------------------------------
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --frozen-lockfile falla si el lockfile no coincide con package.json, en vez de
# resolver en silencio versiones nuevas.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# build: tsup empaqueta el codigo.
# ---------------------------------------------------------------------------
FROM deps AS build

COPY tsconfig.json tsup.config.ts ./
COPY src ./src

RUN pnpm build

# ---------------------------------------------------------------------------
# prod-deps: solo dependencias de runtime.
#
# tsup deja las dependencias fuera del bundle, asi que dist/index.js necesita un
# node_modules de produccion al lado. Esta es la estrategia explicita de S14.
# ---------------------------------------------------------------------------
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# ---------------------------------------------------------------------------
# runtime: imagen final.
# ---------------------------------------------------------------------------
FROM base AS runtime

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node

EXPOSE 3000

# El healthcheck no usa curl porque la imagen slim no lo trae: usa el propio Node.
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/v1/no-existe').then(r=>process.exit(r.status>0?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]