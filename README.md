# API REST WITH NODEJS AND EXPRESS

## Descripción

Este proyecto es una plantilla básica para crear una API REST utilizando Node.js, Express, y TypeScript. Está configurado con una estructura de carpetas sencilla y está listo para ser extendido con nuevas funcionalidades según sea necesario.

## Requisitos Previos

- Node.js (versión 16 o superior)
- pnpm (opcional pero recomendado)

## Estructura del Proyecto

- **src/**: Contiene todo el código fuente de la API.
  - **config/**: carpeta donde se guarta toda la configuracion de la API de forma global.
  - **constants/**: carpeta donde se definen las constantes globales.
  - **helpers/**: carpeta donde se almacena las funciones que cumplen una funcion especifica y pueden ser utilizados de forma global.
  - **modules/**: Agrupa módulos específicos del proyecto
    - **funcionalidad/**: carpeta de la funcionalidad o modulo correspondiente:
      - **controllers/**: Contiene los controladores que manejan la lógica de las rutas relacionadas con el modulo.
      - **helpers/**: Funciones auxiliares específicas para el módulo.
      - **middlewares/**: Middlewares aplicados en el ciclo de vida del modulo.
      - **models/**: Define los modelos de datos relacionados con el modulo.
      - **routes/**: Define las rutas relacionadas con el modulo.
      - **schemas/**: Esquemas de validación para el modulo.
      - **services/**: Lógica de negocio relacionada con el modulo.
  - **server/**: Carpeta relacionada con el inicio del servidor.
- **.env.example**: Archivo de ejemplo para variables de entorno.
- **tsconfig.json**: Configuración de TypeScript.
- **package.json**: Contiene las dependencias y scripts del proyecto.

Esta organización modular y clara facilitara la escalabilidad y el mantenimiento del código, permitiendo que cada módulo tenga su propia estructura bien definida.

## Instalación

1. Clona este repositorio:

  ```bash
  git clone https://github.com/JuanCardona16/api-rest-express-template.git
  ```

2. Instalación de dependencias:

  ```bash
  pnpm install
  ```

3. Crea un archivo .env basado en .env.example y ajusta las variables según tu entorno.

4. Inicial el servidor en modo de desarrollo:

- Para iniciar el modo de desarrollo normal copia este comando:

  ```bash
  pnpm dev
  ```

- Para iniciar el modo de desarrollo con nodemo copia el siguiente comando:
  
  ```bash
  pnpm dev:node
  ```

