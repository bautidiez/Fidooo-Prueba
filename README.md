# FibooChat — Aplicación Fullstack

Chat en tiempo real potenciado por **OpenAI ChatGPT**, **Firebase**, **Next.js 14** y **NestJS**.

## 🏗️ Arquitectura

- `/frontend`: App de Next.js. Maneja la UI, la autenticación directa con Firebase Client SDK, y se suscribe a los mensajes de Firestore en tiempo real usando un hook de Zustand (`useRealtimeMessages` + `useChatStore`).
- `/backend`: App de NestJS. Actúa como capa de abstracción hacia ChatGPT de OpenAI. Protegido por el Firebase Admin SDK para verificar los tokens. Genera las respuestas y las escribe directamente a la base de Firestore del usuario.

## 🚀 Pre-requisitos & Configuración Inicial

El proyecto está diseñado pensando en escalabilidad pero también para arrancar de forma 100% gratuita usando la capa gratuita de Firebase (Plan Spark) y el MOCK mode si decides probar sin agregar saldo en OpenAI.

### 1. Configurar Firebase (Base de Datos & Auth)

El Backend y el Frontend comparten el mismo proyecto de Firebase. 
1. Entrar a la [Consola de Firebase](https://console.firebase.google.com/) y crear un proyecto (completamente gratis).
2. Entrar a **Authentication**, click en "Comenzar", e ir a la sección "Sign In Method". Ahí activar el proveedor **Correo electrónico y contraseña** (dejando la opción "Vínculo al correo electrónico" deshabilitada). Guardar.
3. Entrar a **Firestore Database**, crear base de datos en modo "Producción". Configura las reglas de Firebase copiando lo siguiente para que sea seguro:
   ```js
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /chats/{userId}/messages/{messageId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
4. **Para el Frontend (`.env.local`)**: Ve a la tuerca "Configuración del proyecto" en Firebase → "Agregar app Web". Copia las variables `apiKey`, `projectId`, etc. a tu archivo `frontend/.env.local`. *(Usa el `frontend/.env.example` de guía)*.
5. **Para el Backend (`.env`)**: Ve a "Configuración del proyecto" → "Cuentas de servicio" → generar una nueva clave privada. Esto descarga un JSON. Copia las propiedades `projectId`, `private_key` (entera, con los `\n`) y el `client_email` a tu `backend/.env`. *(Usa el `backend/.env.example` de guía)*.

### 2. Configurar OpenAI (Opcional - Mock Mode Activo)

- Ve a tu app `backend/`. Abre y renombra `.env.example` a `.env`. 
- Completalo con las claves de Firebase mencionadas arriba.
- Si dejas la variable `OPENAI_API_KEY=` vacía, el sistema arranca automáticamente en modo de pruebas respondiéndote de forma inteligente pero simulada. ¡Perfecto para no gastar una moneda mientras se desarrolla/prueba!

---

## 🏃‍♂️ Levantar el proyecto

### Iniciar Backend

```bash
cd backend
npm install
npm run start:dev
# Corre en http://localhost:3001
```

### Iniciar Frontend

Abre otra terminal:

```bash
cd frontend
npm install
npm run dev
# Corre en http://localhost:3000
```

Entra a `http://localhost:3000`, créate una cuenta y comienza a chatear.
