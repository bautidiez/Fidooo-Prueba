# 🌀 Fiboo AI Chat — Smart Conversations

**Fiboo AI Chat** es una plataforma de inteligencia artificial diseñada para ofrecer una experiencia de conversación fluida, rápida y futurista. El sistema está construido con una arquitectura escalable de microservicios, utilizando lo último en tecnología de modelos de lenguaje (LLM).

![Fiboo Banner](https://raw.githubusercontent.com/bautidiez/Fidooo-Prueba/main/public/assets/logo.png)

## 🚀 Características Principales

*   **⚡ Motor de IA con Groq**: Integración profunda con **Llama 3.3 70B** para respuestas instantáneas con latencia mínima.
*   **📂 Historial de Conversaciones**: Sistema de sesiones persistentes que permite navegar entre chats pasados y crear nuevas salas instantáneamente.
*   **📑 Soporte Markdown Completo**: Renderizado profesional de código, tablas, negritas, listas y más, para una lectura técnica óptima.
*   **💬 Mensajería en Tiempo Real**: Sincronización inmediata de mensajes mediante Firebase Firestore.
*   **🛡️ Autenticación Segura**: Sistema robusto basado en Firebase Auth con verificación de correo obligatoria.
*   **🎨 Interfaz de Vanguardia**: Diseño "Glassmorphism" con auroras dinámicas, animaciones fluidas y modo oscuro nativo.

## 🛠️ Stack Tecnológico

### Frontend (User Interface)
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + Custom Animations
- **Estado**: Zustand
- **Markdown**: React-Markdown + Remark-GFM

### Backend (Logic API)
- **Framework**: [NestJS](https://nestjs.com/)
- **Infraestructura**: Firebase Admin SDK
- **Motor AI**: Groq Cloud API API (llama-3.3-70b-versatile)

### Infraestructura
- **Base de Datos**: Google Cloud Firestore (Real-time DB)
- **Auth**: Firebase Authentication
- **Deploy**: Vercel

## ⚙️ Configuración del Proyecto

### Variables de Entorno (.env)

| Variable | Descripción |
| :--- | :--- |
| `GROQ_API_KEY` | Clave de acceso a la API de Groq |
| `PROJECT_ID` | Tu ID de proyecto de Firebase |
| `CLIENT_EMAIL` | Email de la Service Account de Firebase |
| `PRIVATE_KEY` | Llave privada para Firebase Admin (Sanitizada) |

## 📦 Instalación y Uso

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/bautidiez/Fidooo-Prueba.git
    ```
2.  **Instalar dependencias**:
    ```bash
    # En la carpeta /frontend
    npm install
    # En la carpeta /backend
    npm install
    ```
3.  **Correr en desarrollo**:
    ```bash
    npm run dev
    ```

---
Desarrollado con ❤️ por **Fidooo Engineering**.
