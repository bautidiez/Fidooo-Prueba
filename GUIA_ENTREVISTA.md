# 🌀 Guía Maestro para la Defensa Técnica — Fiboo AI Chat

Esta guía está diseñada para que puedas explicar tu proyecto desde cero, con total claridad y profesionalismo, ante un equipo técnico o de recursos humanos. Está estructurada siguiendo la **consigna oficial** y resaltando tus **aportes de valor personalizados**.

---

## 📖 1. Introducción al Stack (Explicación para No-Expertos)

Si te preguntan "¿Qué herramientas usaste?", podés explicarlo así:

*   **Next.js 14**: Es el "motor" del sitio web. A diferencia del HTML común, nos permite crear páginas que cargan muy rápido y que Google puede leer fácilmente (SEO). Usamos el **App Router**, que es la tecnología más moderna de Next.js para organizar las rutas de la página.
*   **NestJS**: Es el cerebro de nuestro servidor (backend). Es como la estructura de un edificio bien construido: nos obliga a ser ordenados y separar las piezas (módulos) para que, si el proyecto crece, no se convierta en un caos.
*   **Firebase Authentication**: Es el sistema de seguridad de Google. En lugar de guardar nosotros las contraseñas (lo cual es arriesgado), dejamos que Google maneje la identidad, los tokens y la seguridad de los datos de los usuarios.
*   **Firebase Firestore**: Es nuestra base de datos en tiempo real. Imaginalo como una hoja de Excel gigante en la nube que le avisa automáticamente a la web cada vez que alguien escribe algo nuevo, sin que el usuario tenga que refrescar la página.
*   **Zustand**: Es el "almacén" de datos de la aplicación. En lugar de pasar información de un componente a otro de forma complicada, Zustand nos da un lugar central donde guardamos cosas como "quién es el usuario" y "qué mensajes hay en el chat", para que cualquier pantalla pueda leer esos datos al instante.
*   **Groq AI / Llama 3.3**: Es el motor de inteligencia artificial. Aunque la consigna pedía ChatGPT (OpenAI), decidí usar Groq porque utiliza procesadores ultra-rápidos (LPU) que responden casi 10 veces más rápido que el ChatGPT tradicional, y ofrece un servicio gratuito excelente para desarrolladores.

---

## 🎯 2. Mapa de Cumplimiento (Basado en la Consigna)

Aquí explicamos cómo cumplimos cada punto del PDF que te dieron:

### ● Parte 1: Inicio de Sesión
*   **Login con Email/Pass**: Implementado en `frontend/components/auth/LoginForm.tsx`.
*   **Gestión con Firebase Auth**: Todas las llamadas se centralizan en `frontend/lib/firebase/auth.ts`.
*   **Registro (Opcional)**: Agregamos una pantalla de Registro con validaciones en tiempo real (`RegisterForm.tsx`).
*   **Restablecer Contraseña (Opcional)**: Implementamos el flujo completo de reseteo mediante email (`ResetPasswordForm.tsx`).

### ● Parte 2: Chat Simple con Real-time
*   **Pantalla de Chat**: Diseñada en `frontend/app/chat/page.tsx` con una estética premium.
*   **Tiempo Real**: Usamos el hook `useRealtimeMessages.ts` que utiliza la función `onSnapshot` de Firestore para "escuchar" la base de datos sin latencia.
*   **Orden Cronológico**: Los mensajes se ordenan por un campo de `timestamp` del servidor, garantizando que el chat fluya correctamente.
*   **Manejador de Estados (Zustand)**:
    *   `useAuthStore.ts`: Guarda quién está logueado.
    *   `useChatStore.ts`: Maneja la lista de mensajes y la sincronización.

### ● Parte 3: Backend en NestJS
*   **Servidor Separado**: Creamos un backend robusto en la carpeta `/backend`.
*   **Validación de Token**: Implementamos un **AuthGuard** (`auth.guard.ts`) que intercepta cada mensaje. Si el frontend no envía un "ID Token" válido generado por Firebase, el backend rechaza la petición. Esto protege tu API de accesos no autorizados.
*   **Conexión con IA**: El servicio `GroqService.ts` en el backend se encarga de hablar con la IA y obtener la respuesta.
*   **Respuesta Automática**: El backend no solo responde, sino que **lo guarda directamente en Firestore**. Esto hace que el mensaje de la IA aparezca automáticamente en la pantalla del usuario como "Mensaje del Sistema".

---

## ✨ 3. Valores Añadidos (Lo que no pedían, pero hiciste)

Esto es lo que te hará destacar frente a otros candidatos:

1.  **Login con Google**: Permitimos que el usuario entre con un solo click (`GoogleAuthProvider`), mejorando muchísimo la experiencia del usuario (UX).
2.  **Verificación de Email Obligatoria**: Implementamos un filtro de seguridad. Si el usuario se registra pero no verifica su mail, el chat se bloquea hasta que confirme su identidad. Esto previene el spam.
3.  **Historial de Conversaciones (Sidebar)**: El proyecto no es solo un chat simple; permite crear múltiples "hilos" de conversación, eliminarlos y navegar entre ellos. Esto requiere una arquitectura de base de datos mucho más avanzada.
4.  **Diseño Aurora UI**: No usamos un diseño genérico. Implementamos un estilo visual futurista con fondos "Aurora" (degradados animados), transiciones suaves y modo oscuro premium.
5.  **Resiliencia en URLs**: Corregimos un error común de Vercel/Android donde los links de recuperación de contraseña se rompen. El `middleware.ts` y `next.config.ts` tienen lógica especial para "sanitizar" estas rutas.

---

## 🔍 4. Tour Arquitectónico (¿Qué hay en cada lugar?)

Si te preguntan "¿Dónde está el código de X?", usá este mapa:

### 🌐 Frontend (Carpeta `/frontend`)
-   **/app**: Aquí están las páginas (rutas). `chat/page.tsx` es la vista principal.
-   **/components**: Aquí hay piezas reutilizables.
    -   `auth/`: Todos los formularios (Login, Register, Reset).
    -   `chat/`: La `ChatWindow` (ventana de mensajes) y el `MessageInput`.
    -   `ui/`: Botones, Inputs y el Loader animado.
-   **/hooks**: Lógica de React.
    -   `useAuth.ts`: El "latido" de la app que sabe si estás logueado.
    -   `useRealtimeMessages.ts`: El conector con Firestore para el chat en vivo.
-   **/store**: La memoria global (Zustand).
-   **/lib/firebase**: La configuración oficial de conexión con Google.

### ⚙️ Backend (Carpeta `/backend`)
-   **/src/auth**: El `AuthGuard` (el guardián de la seguridad).
-   **/src/ai**: La integración con Groq/IA.
-   **/src/chat**: El controlador que recibe el mensaje y el servicio que lo procesa.
-   **/src/config**: Donde limpiamos y validamos las llaves secretas para Vercel.

---

## ❓ 5. Preguntas Clave para ganar la entrevista

### 1. ¿Cómo integraste el estado global?
"Usé **Zustand** porque es mucho más ligero que Redux. Creé un store de Auth para saber si el usuario está verificado y un store de Chat para manejar los mensajes. Esto permite que el sidebar y la ventana de mensajes estén siempre sincronizados sin refrescar la página."

### 2. ¿Cómo es el flujo de un mensaje?
"Es un flujo híbrido. El mensaje del **usuario** se guarda directamente desde el frontend a Firestore para que la UI sea instantánea. Pero la respuesta de la **IA** se genera en mi backend NestJS. El backend valida el token del usuario, pide la respuesta a la IA y la guarda en Firestore. Como el frontend está 'escuchando' Firestore, la respuesta aparece mágicamente en pantalla."

### 3. ¿Tuviste algún desafío técnico?
"Sí, la gestión de las variables de entorno en Vercel. La llave privada de Firebase se corrompía al desplegar. Implementé una lógica de normalización en el backend para limpiar los saltos de línea (`\n`) y asegurar que la conexión con el Admin SDK sea siempre estable."

### 4. ¿Por qué NestJS y no solo Express?
"NestJS nos da una estructura empresarial. Utiliza decoradores y módulos que hacen que el código sea testeable y escalable. Para una entrevista técnica, NestJS demuestra que conozco patrones de diseño modernos como la Inyección de Dependencias."

---

## 🚀 Entregables Finales
*   **Repositorio**: [https://github.com/bautidiez/Fidooo-Prueba](https://github.com/bautidiez/Fidooo-Prueba)
*   **Deploy Frontend**: [https://fiboochat-teal.vercel.app](https://fiboochat-teal.vercel.app)
*   **Deploy Backend**: [https://fidooo-backend.vercel.app](https://fidooo-backend.vercel.app)
