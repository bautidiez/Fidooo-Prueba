# 🌀 Guía de Defensa Técnica — Fiboo AI Chat

Esta guía contiene toda la información estratégica, técnica y de resolución de problemas necesaria para defender el proyecto Fiboo ante un equipo de evaluación técnica.

---

## 🏗️ TAREA 2 — Arquitectura y Decisiones Técnicas

### 1. Estructura de Carpetas (Clean Architecture Lite)
- **Dónde:** Raíz del proyecto `/backend` y `/frontend`.
- **Por qué:** Se utilizó una estructura monorepo (separada por carpetas) para facilitar el despliegue paralelo en Vercel. En el frontend, se sigue el patrón de **Next.js App Router** (carpetas `app/`, `components/`, `hooks/`, `lib/`, `store/`), lo que separa claramente la lógica de negocio (lib/hooks) de la representación visual (components/app).
- **Conexión:** La carpeta `lib/firebase` centraliza la conexión con el SDK, que luego es consumida por los `hooks` para entregar datos limpios a los componentes.

### 2. Firebase Config (`lib/firebase/config.ts`)
- **Dónde:** `frontend/lib/firebase/config.ts`
- **Por qué:** Centraliza el objeto `FirebaseApp`. Separarlo asegura que no estemos inicializando la conexión múltiples veces (Singleton pattern), lo cual degradaría el rendimiento y causaría errores de "App already exists".

### 3. Zustand Stores (`useAuthStore`, `useChatStore`)
- **Dónde:** `frontend/store/`
- **Por qué:** Se eligió **Zustand** sobre Redux o Context API por su extrema simplicidad y nulo "boilerplate". A diferencia de Context, Zustand no provoca re-renders innecesarios en todo el árbol de componentes al actualizar un solo slice de estado, lo cual es crítico para una app de chat en tiempo real.

### 4. Hook `useRealtimeMessages` (onSnapshot)
- **Dónde:** `frontend/hooks/useRealtimeMessages.ts`
- **Por qué:** `onSnapshot` de Firestore permite una conexión vía WebSockets (o long polling según el navegador) que actualiza la UI al instante cuando llega un mensaje. Usar un `fetch` periódico (polling) sería ineficiente por el consumo de red y la latencia en la conversación.

### 5. Hook `useAuth` + `onAuthStateChanged`
- **Dónde:** `frontend/hooks/useAuth.ts`
- **Por qué:** Escucha el evento de cambio de estado de Firebase. Es el "latido" de la app: si el token expira o el usuario cierra sesión, este hook limpia el store de Zustand automáticamente, garantizando que la sesión sea persistente y segura.

### 6. Middleware de Next.js
- **Dónde:** `frontend/middleware.ts`
- **Por qué:** La protección de rutas se hace a nivel de **Edge Runtime**. Esto significa que si un usuario sin sesión intenta entrar a `/chat`, la redirección ocurre antes de que el navegador llegue a renderizar un solo pixel de la página buscada, ahorrando recursos y mejorando la seguridad.

### 7. AuthGuard de NestJS
- **Dónde:** `backend/src/auth/auth.guard.ts`
- **Por qué:** Aunque el frontend es seguro, el backend debe serlo aún más. El Guard verifica el `ID Token` enviado en el header. Si es inválido, rechaza la petición con un 401. Esto evita que alguien "ataque" el endpoint de la IA directamente usando herramientas como Postman.

### 8. ChatService de NestJS
- **Dónde:** `backend/src/chat/chat.service.ts`
- **Por qué:** Actúa como el cerebro del servidor. Recibe el prompt del usuario, lo procesa con Groq y, lo más importante, **persiste la respuesta en Firestore**. Esto permite que el frontend reciba la respuesta de la IA de forma pasiva a través del listener `onSnapshot`.

### 10. Firestore Security Rules
- **Qué son:** Reglas que corren directamente en los servidores de Google.
- **Por qué:** Son la última línea de defensa. Incluso si alguien roba las API Keys del frontend, las reglas impiden que un usuario lea o escriba mensajes de otro usuario (basado en el `request.auth.uid`).

---

## 🛠️ TAREA 3 — Complicaciones y Soluciones

**1. Problema: Error 429 de OpenAI por falta de saldo**
- **Causa raíz:** OpenAI requiere una carga mínima de USD 5 para habilitar el uso de su API, lo cual es una barrera para proyectos de prueba.
- **Solución:** Migración a **Groq AI**.
- **Dónde:** `backend/src/ai/groq.service.ts`
- **Aprendizaje:** Aprendí a valorar la agilidad de los **LPU (Language Processing Units)** de Groq, que ofrecen una inferencia mucho más rápida (hasta 800 tokens/seg) y un tier gratuito generoso.

**2. Problema: Corrupción de `PRIVATE_KEY` de Firebase en Vercel**
- **Causa raíz:** Al pegar la llave privada de Firebase en el panel de Vercel, los caracteres de salto de línea `\n` se guardan como texto literal, lo que causa errores de parseo ASN.1.
- **Solución:** Implementación de un `.replace(/\\n/g, '\n')` y limpieza de comillas en el archivo de configuración.
- **Dónde:** `backend/src/config/configuration.ts:L47-50`
- **Aprendizaje:** Entendí que la gestión de secretos en CI/CD requiere sanitización manual del lado del servidor para garantizar la compatibilidad entre entornos (Local vs Producción).

**3. Problema: Desincronización de Sesión en el Middleware**
- **Causa raíz:** Firebase guarda la sesión en LocalStorage (lado cliente), pero el Middleware de Next.js corre en el servidor y no tiene acceso al LocalStorage.
- **Solución:** Implementación de una **Cookie de Sesión (`__session`)** que se sincroniza durante el login y se verifica en el middleware.
- **Dónde:** `frontend/middleware.ts` y `frontend/app/chat/page.tsx:L33`
- **Aprendizaje:** Aprendí a manejar arquitecturas *Server-Side Rendering* (SSR) y cómo tender puentes de estado entre el cliente y el servidor mediante cookies de seguridad.

**4. Problema: Conflicto de `middleware.ts` y `proxy.ts` en Vercel**
- **Causa raíz:** La versión de Next.js/Vercel detectaba dos interceptores de rutas, rompiendo el build de producción.
- **Solución:** Eliminación del archivo redundante y consolidación de toda la lógica de protección en el `middleware.ts` estándar de Next.js.
- **Dónde:** Acción de borrado en el sistema de archivos y actualización del middleware principal.
- **Aprendizaje:** Mantener un codebase limpio de archivos legacy es vital para la estabilidad de las Web Vitals y el proceso de CI/CD.

---

## ✅ TAREA 4 — Mapa de Requisitos

| Requisito | Estado | Dónde Verlo | Cómo Explicarlo |
| :--- | :--- | :--- | :--- |
| **Login Email/Pass** | ✅ Cumplido | `frontend/app/login/page.tsx` | "Usa Firebase SDK para manejar la autenticación robusta y redirecciones automáticas." |
| **Auth Integrado** | ✅ Cumplido | `frontend/lib/firebase/auth.ts` | "Centralizamos todas las llamadas a Firebase para facilitar el mantenimiento y testing." |
| **Registro de Usuarios** | ✅ Bonus | `frontend/components/auth/RegisterForm.tsx` | "Incluye validaciones de contraseña en tiempo real para mejorar la UX." |
| **Real-time Chat** | ✅ Cumplido | `frontend/hooks/useRealtimeMessages.ts` | "Implementado con onSnapshot para actualizaciones de baja latencia." |
| **Zustand State** | ✅ Cumplido | `frontend/store/useChatStore.ts` | "Estado global ligero que sincroniza los mensajes entre componentes." |
| **Backend NestJS** | ✅ Cumplido | `backend/src/` | "Estructura modular con Controllers, Services y Guards siguiendo SOLID." |
| **Respuesta IA** | ✅ Cumplido | `backend/src/ai/groq.service.ts` | "Integración con Llama 3.3 vía Groq para respuestas inteligentes ultra-rápidas." |

---

## 🧠 TAREA 5 — Features Extras (El "Plus")

1. **Login con Google**: Implementado vía `GoogleAuthProvider`. Mejora la tasa de conversión de usuarios al permitir acceso con un solo click.
2. **Verificación de Email**: Lógica de bloqueo en el frontend que exige validar el mail antes de chatear. Protege contra registros masivos falsos.
3. **Historial de Conversaciones**: El sidebar permite crear y navegar entre diferentes chats, persistiendo el contexto en Firestore.
4. **Validación de Passwords**: Interfaz visual dinámica que indica si la contraseña cumple con mayúsculas, números y longitud mínima antes de enviar el formulario.
5. **Notice de Spam**: Texto preventivo en formularios de envío de mail para reducir la tasa de soporte por mails no recibidos.

---

## 📖 TAREA 6 — Glosario Técnico

### Firebase Admin SDK vs Client SDK
- **Nivel Simple:** El "Client" es por donde el usuario entra a la app. El "Admin" es un pase maestro que tiene el servidor para hacer cosas prohibidas al usuario común.
- **Nivel Técnico:** El Client SDK corre en el browser, limitado por Security Rules. El Admin SDK corre en NestJS, tiene privilegios totales sobre Firebase y se autentica mediante una Service Account JSON.
- **Ejemplo:** El frontend usa Client para leer mensajes; el backend usa Admin para validar tokens y persistir respuestas de la IA.

### JWT (JSON Web Token)
- **Nivel Simple:** Es como el carnet de un club. El login te lo da y el club lo revisa cada vez que querés entrar a la pileta.
- **Nivel Técnico:** Es un estándar para transmitir información segura entre partes. Firebase emite un `ID Token` (JWT) firmado que el backend valida usando la llave pública de Google.
- **Ejemplo:** Se envía en el header de cada petición a `/chat` en el backend.

### CORS (Cross-Origin Resource Sharing)
- **Nivel Simple:** Es un guardaespaldas que solo deja pasar a las visitas que el dueño de casa conoce.
- **Nivel Técnico:** Mecanismo de seguridad del navegador que restringe peticiones HTTP entre dominios distintos. Se configuró en `main.ts` de NestJS para aceptar solo el dominio de Vercel del frontend.

---

## ❓ TAREA 7 — 15 Preguntas de Entrevista (FAQ)

**1. P: ¿Por qué usaste Zustand y no Context API para el estado global?**
**R:** Context API es excelente para datos estáticos (temas, idiomas), pero para una app de chat con actualizaciones frecuentes, Zustand es superior. Context provoca re-renders en todos los hijos cada vez que el valor cambia; Zustand permite realizar "subscriptions" granulares para que solo se actualice el componente que necesita los mensajes, optimizando el rendimiento.

**2. P: ¿Cómo garantizás que un usuario no lea los mensajes de otro en Firestore?**
**R:** No dependemos solo del frontend. Implementé **Firestore Security Rules** que verifican el `auth.uid` del request contra el `userId` guardado en el documento del mensaje. Si no coinciden, Firestore bloquea la lectura directamente en la base de datos, incluso si se intenta acceder con una API Key robada.

**3. P: ¿Qué harías si el sistema crece a 10.000 usuarios activos simultáneos?**
**R:** En el backend, pasaría de una instancia de NestJS a un clúster balanceado tras un Nginx. En la base de datos, Firestore escala automáticamente (auto-sharding), pero optimizaría los costos implementando paginación real (limit/startAfter) en el hook de mensajes para no traer miles de mensajes de golpe.

**4. P: ¿Por qué elegiste Groq sobre OpenAI para este proyecto?**
**R:** Groq utiliza **LPUs (Language Processing Units)** que son procesadores diseñados específicamente para modelos de lenguaje. Esto permite una velocidad de inferencia de tokens hasta 10 veces mayor que el hardware tradicional en la nube. Además, su tier de desarrolladores es gratuito, lo que facilita el desarrollo y testeo de este tipo de MVPs.

**5. P: ¿Cómo manejás la expiración del token de sesión?**
**R:** El hook `useAuth` utiliza `onAuthStateChanged`. Firebase gestiona la renovación automática de tokens (refresh tokens) en segundo plano. Si el token expira y falla la renovación, el hook dispara una actualización del estado a `null`, gatillando el Middleware para expulsar al usuario de la ruta protegida instantáneamente.

**6. P: ¿Cómo manejaste el problema de los saltos de línea de la Service Account en Vercel?**
**R:** Implementé una lógica de normalización en el archivo de configuración (`configuration.ts`) que reemplaza los caracteres `\n` literales por saltos de línea reales usando un RexExp, además de limpiar comillas dobles accidentales.

**7. P: ¿Qué arquitectura sigue tu Backend en NestJS?**
**R:** Sigue una arquitectura **Modulizada** y basada en **Inyección de Dependencias**. Cada funcionalidad (IA, Chat, Auth, Firebase) vive en su propio módulo, lo que respeta el principio de Responsabilidad Única de SOLID.

**8. P: ¿Cómo evitas el "Hydration Mismatch" en Next.js con componentes que dependen del auth?**
**R:** Usamos un estado de `isLoading` inicial en el store de Zustand y el hook `useAuth`. Hasta que Firebase no confirma el estado inicial de la sesión, el componente no renderiza elementos dinámicos que podrían chocar con el HTML generado en el servidor.

**9. P: ¿Tu aplicación es segura contra ataques XSS?**
**R:** Al usar Next.js y React, la mayoría de las salidas de texto se escapan automáticamente. Además, no usamos `dangerouslySetInnerHTML`. Para la persistencia, las reglas de Firestore aseguran que un usuario solo pueda inyectar datos en sus propias colecciones.

**10. P: ¿Cómo optimizaste el rendimiento visual de la aplicación?**
**R:** Implementamos **Aurora Backgrounds** usando degradados CSS y animaciones aceleradas por hardware. También usamos `next/image` para el logo y fotos de perfil, lo que optimiza el tamaño de las imágenes y previene el Cumulative Layout Shift (CLS).

**11. P: ¿Qué ventaja tiene usar NestJS con Firebase en lugar de solo Firebase con Cloud Functions?**
**R:** NestJS me permite tener un control total sobre el ciclo de vida de la aplicación, una mejor estructura para escalar lógica de negocio compleja (como el ruteo hacia diferentes proveedores de IA) y una experiencia de desarrollo local más robusta y desacoplada del proveedor de nube.

**12. P: ¿Cómo resolviste el 404 al recuperar contraseñas desde dispositivos móviles?**
**R:** Detectamos que algunas aplicaciones (como Gmail o Outlook) agregan un punto final `.` a los links de Firebase. Implementamos una redirección permanente en `next.config.ts` y lógica de corrección en el `middleware.ts` para sanitizar la URL antes de cargar la página.

**13. P: ¿Para qué sirve el `AuthGuard` si ya tienes un Middleware en Next.js?**
**R:** Es seguridad en profundidad. El Middleware protege la navegación visual, pero el `AuthGuard` garantiza que si alguien intenta llamar directamente a la API del backend desde Postman o CURL, la petición sea rechazada si no tiene un JWT válido.

**14. P: ¿Por qué usaste Cookies y no solo LocalStorage para la sesión?**
**R:** Para poder implementar protección de rutas en el lado del servidor. Las Cookies (`__session`) viajan en las cabeceras HTTP, permitiendo que el Middleware de Next.js actúe antes de que el código del navegador se ejecute.

**15. P: ¿Cómo integraste el historial de conversaciones?**
**R:** Creamos un listener en `Sidebar.tsx` que escucha la colección `conversations` del usuario. Al hacer clic en una, el `useChatStore` actualiza el `activeConversationId` y el hook `useRealtimeMessages` se re-suscribe automáticamente a los mensajes de esa nueva conversación.

---

## 🚀 Recomendaciones Futuras
1. **Paginación Infinita**: Implementar `limit()` y `startAfter()` en el hook de mensajes para soportar chats de larga duración.
2. **Mensajes de Voz/Audio**: Integrar Firebase Storage para permitir el envío de archivos multimedia.
3. **Tests Unitarios**: Añadir Jest en el backend y React Testing Library en el frontend para asegurar la integridad de los flujos de autenticación.
