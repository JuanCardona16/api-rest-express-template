# Documentación del Proyecto

Este documento tiene como objetivo proporcionar una visión general de la arquitectura, los patrones de diseño, la estructura del proyecto y la documentación de los endpoints de la API.

## 1. Arquitectura del Proyecto

El proyecto sigue una arquitectura modular y en capas, diseñada para promover la separación de responsabilidades, la escalabilidad y la mantenibilidad. Se basa en el patrón **Clean Architecture** o **Arquitectura Hexagonal** (Ports and Adapters), donde el dominio del negocio es el centro y las capas externas (infraestructura, UI) se adaptan a él.

## Capas Principales:

- **`src/core`**: Contiene la lógica central de la aplicación, como la configuración de Express, el manejo global de errores, middlewares generales y la configuración de rutas principales.
- **`src/features`**: Aquí se encuentran los módulos de negocio de la aplicación. Cada "feature" (característica) es un módulo independiente que encapsula su propia lógica de negocio, controladores, servicios, repositorios, interfaces y esquemas. Ejemplos: `authentication`, `user`.
- **`src/infrastructure`**: Contiene las implementaciones de los "adaptadores" que interactúan con servicios externos, como bases de datos (MongoDB) y sistemas de caché (Redis).
- **`src/lib`**: Incluye utilidades y librerías compartidas que no pertenecen directamente a una característica o a la infraestructura, como manejadores de errores personalizados, helpers para JWT y manejo de contraseñas.
- **`src/config`**: Almacena la configuración de la aplicación, como CORS, variables de entorno, cabeceras de respuesta y configuración de Swagger.
- **`src/constants`**: Define constantes globales utilizadas en toda la aplicación, como prefijos de API y rutas.

### Sistema de capas por funcionalidad

#### Capa de Contratos (#1)

En esta capa encontraremos todos los contratos de entrada y salida de los servicios. Como tipos e interfaces utilizadas en esa funcionalidad. Esto nos ayudara a tener una mejor estructura y escalabilidad en nuestra aplicacion.

#### Capa de Acceso a Datos (#2)

La capa de Acceso a Datos es responsable de:

- Gestionar todas las operaciones de base de datos
- Transformar datos entre el formato de base de datos y objetos de dominio
- No contiene lógica de negocio

Esta capa actúa como una abstracción entre la base de datos y el resto de la aplicación, asegurando una clara separación de responsabilidades.

#### Capa de Servicios (Logica de Negocio) (#3)

La capa de Servicios es responsable de:

- Implementar reglas de negocio
- Validaciones complejas
- Coordinacion entre multiples repositorios
- No contiene lógica de acceso a datos
- Transformaciones de datos para la logica de negocio

Esta capa es responsable de implementar toda la lógica de negocio compleja. Se encarga de orquestar las operaciones entre las diferentes capas, aplicar las reglas de negocio específicas del dominio, realizar transformaciones de datos necesarias, y coordinar el flujo de información utilizando los servicios proporcionados por otras capas. Actúa como un intermediario inteligente que garantiza que todas las operaciones cumplan con los requisitos y reglas establecidas por el negocio.

#### Capa de Controladores (Manejo de HTTP) (#4)

La capa de Controladores es responsable de:

- Manejar requests y responses HTTP
- Validar los datos de entrada básicos
- Transformar datos entre HTTP y objetos de dominio
- Manejar códigos de estado HTTP
- No contiene lógica de negocio

Esta capa es responsable de recibir las peticiones HTTP, validar los datos de entrada, invocar los servicios correspondientes, transformar los datos de salida y devolver las respuestas HTTP. Es el punto de entrada y salida de la aplicación para las peticiones HTTP.

#### Capa de Rutas

La capa de Rutas es responsable de:

- Definir endpoints HTTP
- Asociar endpoints con métodos del controlador
- Aplicar middlewares específicos de ruta (si es necesario)

Esta capa es responsable de definir las rutas de la API y asignar las peticiones HTTP a los controladores correspondientes. Es el punto de entrada para las peticiones HTTP y se encarga de enrutar las peticiones a los controladores adecuados.

## 2. Patrones de Diseño Implementados

- **Separación de Responsabilidades (SRP)**: Cada módulo y capa tiene una única responsabilidad bien definida.
- **Inversión de Dependencias (DIP)**: Las capas de alto nivel (lógica de negocio) no dependen de las capas de bajo nivel (infraestructura). En su lugar, ambas dependen de abstracciones (interfaces). Esto se observa en el uso de interfaces de repositorio en la capa de `features` y su implementación en la capa de `infrastructure`.
- **Middleware Pattern**: Utilizado extensivamente en Express para manejar solicitudes HTTP, validación, autenticación y manejo de errores.
- **Singleton Pattern**: Posiblemente utilizado para la conexión a la base de datos o para instancias de servicios que solo necesitan una única instancia global.
- **Repository Pattern**: Abstrae la lógica de acceso a datos, permitiendo que la capa de negocio interactúe con los datos sin conocer los detalles de la base de datos subyacente.

## 3. Estructura del Proyecto

```
api-rest-express-template/
├── .env.example
├── esbuild.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── src/
│   ├── config/             # Configuración de la aplicación (CORS, Env, Headers, Swagger)
│   ├── constants/          # Constantes globales (rutas, etc.)
│   ├── core/               # Lógica central de la aplicación (Express, errores, middleware, rutas principales)
│   │   ├── app.ts          # Configuración principal de Express
│   │   ├── index.ts        # Archivo de inicio de la aplicación
│   │   ├── errors/         # Manejo global de errores
│   │   ├── middleware/     # Middlewares generales (autenticación, rate limit, validación)
│   │   └── routes/         # Rutas principales y manejo de rutas no encontradas
│   ├── features/           # Módulos de negocio (Authentication, User)
│   │   ├── authentication/ # Módulo de autenticación
│   │   │   ├── modules/    # Lógica específica de autenticación (basic, jwt)
│   │   │   └── routes/     # Rutas de autenticación
│   │   └── user/           # Módulo de usuario
│   │       ├── controller/ # Controladores de usuario
│   │       ├── interfaces/ # Interfaces de usuario
│   │       ├── model/      # Modelos de usuario (Mongoose)
│   │       ├── repository/ # Implementaciones de repositorios de usuario
│   │       ├── routes/     # Rutas de usuario
│   │       ├── schemas/    # Esquemas de validación (Zod)
│   │       └── services/   # Lógica de negocio de usuario
│   ├── infrastructure/     # Implementaciones de adaptadores (MongoDB, Redis)
│   │   ├── mongoDb/        # Conexión y modelos de MongoDB
│   │   └── redis/          # Configuración de Redis
│   └── lib/                # Utilidades y librerías compartidas (Custom Errors, JWT, Passwords)
│       ├── HandlerCustomErrors/ # Manejo de errores personalizados
│       ├── Jwt/            # Helpers para JWT
│       └── Passwords/      # Helpers para manejo de contraseñas
└── tsconfig.json
```

## 4. Documentación de Endpoints (Swagger)

La API está documentada utilizando Swagger/OpenAPI. Puedes acceder a la documentación interactiva de los endpoints en la siguiente ruta (una vez que la aplicación esté corriendo):

`http://localhost:[PUERTO]/api/v1/docs`

(Reemplaza `[PUERTO]` con el puerto en el que se ejecuta tu aplicación, generalmente definido en las variables de entorno).

La configuración de Swagger se encuentra en <mcfile name="config.ts" path="src/config/swagger/config.ts"></mcfile> y se inicializa en <mcfile name="app.ts" path="src/core/app.ts"></mcfile>.

## 5. Tecnologías Utilizadas

Este proyecto ha sido construido utilizando las siguientes tecnologías y herramientas clave:

-   **Lenguaje:** TypeScript 5.x+
-   **Entorno de Ejecución:** Node.js 18.x+
-   **Framework Web:** Express.js 4.x
-   **Base de Datos:** MongoDB
-   **ODM (Object Data Modeling):** Mongoose 8.x
-   **Autenticación:** JSON Web Tokens (JWT) con `jsonwebtoken` y `bcryptjs` para hashing de contraseñas.
-   **Validación de Datos:** Zod para validación de esquemas de entrada y Mongoose Schemas para validación a nivel de base de datos.
-   **Seguridad:** `helmet` para cabeceras de seguridad, `express-rate-limit` para prevención de ataques de fuerza bruta, y `cors` para manejo de políticas de origen cruzado.
-   **Variables de Entorno:** `dotenv` para la gestión de configuraciones sensibles.
-   **Documentación API:** Swagger/OpenAPI con `swagger-ui-express` y `swagger-jsdoc`.
-   **Linting y Formateo:** ESLint y Prettier para mantener la consistencia y calidad del código.
-   **Gestor de Paquetes:** pnpm (aunque también es compatible con npm).

## 6. Características Principales

-   **🚀 Framework Robusto:** Construido sobre Express.js, un framework web rápido y minimalista para Node.js.
-   **🔒 Tipado Estático Avanzado:** Utiliza TypeScript para proporcionar un tipado estático completo, lo que mejora la detección de errores en tiempo de desarrollo, la refactorización y la mantenibilidad del código.
-   **🔑 Autenticación Segura:** Implementa un sistema de autenticación basado en JSON Web Tokens (JWT), con tokens almacenados de forma segura en cookies `HttpOnly` y `Secure` para proteger contra ataques XSS.
-   **🛡️ Seguridad Integral:** Incluye medidas de seguridad como el hashing de contraseñas con `bcrypt`, validación de entrada robusta con `Zod`, configuración de cabeceras HTTP seguras con `helmet`, y prevención básica de ataques de fuerza bruta mediante `express-rate-limit`.
-   **💾 Gestión de Datos Eficiente:** Integración con MongoDB a través de Mongoose, un potente ODM que facilita el modelado de datos, la validación de esquemas y la interacción simplificada con la base de datos.
-   **✅ Validación de Datos Exhaustiva:** Valida los esquemas de los cuerpos de solicitud, parámetros y consultas utilizando Zod, complementando las validaciones a nivel de base de datos de Mongoose.
-   **🚦 Arquitectura Modular y Escalable:** Estructura organizada por capas (rutas, controladores, servicios, modelos Mongoose) y por características (`features`), lo que facilita la escalabilidad, la separación de responsabilidades y la mantenibilidad del código.
-   **⚙️ Configuración Centralizada:** Manejo de variables de entorno con `dotenv` para una configuración flexible y segura de la aplicación.
-   **🚨 Manejo Global de Errores:** Un middleware centralizado para capturar y manejar errores de forma consistente en toda la aplicación, proporcionando respuestas estandarizadas.
-   **🧪 Testing Integrado:** Configuración lista para pruebas unitarias y de integración utilizando Jest, asegurando la calidad y el correcto funcionamiento de la lógica de negocio.
-   **📄 Documentación API Automática:** Generación automática de documentación API interactiva con Swagger/OpenAPI, facilitando el consumo y la comprensión de los endpoints.
-   **💅 Calidad de Código:** ESLint y Prettier preconfigurados para asegurar la consistencia del estilo de código y adherencia a las mejores prácticas.

## 7. Configuración Inicial

Para poner en marcha este proyecto en tu entorno local, sigue los siguientes pasos:

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/api-rest-express-template.git
cd api-rest-express-template
```

### 2. Instalar Dependencias
```bash
pnpm install
# o
npm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto y configura las variables de entorno necesarias. Puedes utilizar el archivo `.env.example` como referencia.

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/your_database_name
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d
NODE_ENV=development
```

### 4. Ejecutar la Aplicación

Modo Desarrollo

Para ejecutar la aplicación en modo desarrollo (con recarga en caliente):

```bash
pnpm dev
# o
npm run dev
```

Modo Producción

Para construir y ejecutar la aplicación en modo producción:

```bash
pnpm build
pnpm start
# o
npm run build
npm start
```

## 8. Licencia
Este proyecto está bajo la licencia MIT. Consulta el archivo LICENSE en la raíz del repositorio para más detalles.

© 2025 Juan David Cardona - API Rest Express Template. Todos los derechos reservados.
