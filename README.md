# 🏨 Sistema de Gestión Hotelera - Hotel Elegance ✨

> **Trabajo Final Integrador - Lenguaje 4**

## 🚀 Demo en Vivo
¡Probá la aplicación ahora mismo!
**🌐 [https://horizontesuites.netlify.app/](https://horizontesuites.netlify.app/)**

---

## 📝 Descripción del Proyecto

Este es un sistema **Full-Stack** completo diseñado para la gestión integral de un hotel de lujo. La plataforma conecta tres mundos diferentes: la experiencia del **Huésped**, la operación diaria del **Personal** y la gestión estratégica del **Administrador**.

El objetivo fue crear una aplicación rápida, segura y con una experiencia de usuario (UX) fluida y moderna. 🎨

---

## 🛠️ Stack Tecnológico

### 🎨 Frontend (La Cara Visible)
* ⚛️ **React 18.3** - Biblioteca de UI moderna y reactiva.
* ⚡ **Vite 6.0** - Build tool ultra-rápida.
* 💅 **Tailwind CSS** - Estilos elegantes y 100% responsivos.
* 🧭 **React Router** - Navegación fluida tipo SPA (Single Page Application).
* 📊 **Recharts** - Gráficos de datos interactivos y profesionales.
* 📅 **Date-fns** - Manejo preciso de fechas y reservas.
* ✨ **Lucide React** - Iconografía moderna.

### ☁️ Backend & Base de Datos (El Motor)
* 🐘 **Supabase (PostgreSQL)** - Base de datos relacional robusta.
* ⚡ **Edge Functions (Deno)** - Lógica de servidor segura para:
    * 🔐 Autenticación y Hashing.
    * 🚫 Validación de disponibilidad compleja.
    * 👮‍♂️ Gestión de permisos administrativos.

### 🗺️ Integraciones
* 📍 **Google Maps API** - Ubicación interactiva en el Home.

---

## 🔑 Credenciales de Acceso (Demo)

Para probar los diferentes roles, podés usar estas cuentas o crear las tuyas:

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| 👤 **Usuario (Cliente)** | `cliente@icon.com` | `123456` |
| 👷 **Operador** | `operador@hotel.com` | `temp123` |
| 👑 **Administrador** | `admin@hotel.com` | `admin123` |

---

## 🌟 Funcionalidades Principales

### 1. Seguridad y Autenticación 🔐
* **Hashing SHA-256:** Las contraseñas nunca se guardan en texto plano.
* **Roles & Permisos:** Rutas protegidas según si sos Admin, Operador o Usuario.
* **Mi Perfil:** Los usuarios pueden cambiar su nombre, actualizar su contraseña o borrar su cuenta con seguridad de doble factor (pidiendo pass actual).

### 2. Experiencia del Usuario (Cliente) 🏖️
* **Catálogo Visual:** Exploración de habitaciones y servicios (Spa, Gym, etc.) con fotos.
* **Reservas Inteligentes:** El sistema chequea disponibilidad en tiempo real para evitar *overbooking*.
* **Gestión Total:**
    * Ver reservas activas con nombres claros (nada de IDs raros).
    * **Solicitar Cambios:** Si te arrepentís, podés pedir cambiar la fecha o habitación desde un panel dedicado.
    * **Mensajería:** Chat directo con el hotel mediante el sistema de "Consultas".

### 3. Panel de Operador 🛎️
* **Control Diario:** Vista rápida de todas las reservas activas.
* **Acciones Rápidas:**
    * ✅ **Check-out:** Marcar reservas como completadas.
    * ❌ **Cancelar:** Dar de baja reservas problemáticas.
* **Atención:** Responder las dudas y solicitudes de cambio de los clientes.

### 4. Panel de Administrador (Modo Dios) 👑
* **📊 Dashboard de Estadísticas:**
    * Gráficos de **Ingresos Mensuales** y **Popularidad**.
    * KPIs en tiempo real (Ocupación, Ingresos totales, Pendientes).
* **🛠️ Gestión de Reservas Avanzada:**
    * Filtros potentes por **Fecha**, **Nombre** o **Tipo**.
    * Edición forzosa de reservas (con recálculo automático de precios).
* **🏨 Gestión de Inventario:**
    * Crear/Editar habitaciones con **Selectores Dinámicos**.
    * ¡Crear nuevas Amenidades (ej: Netflix) al vuelo!
* **👥 Gestión de Personal:**
    * Crear Operadores de forma segura.
    * Ascender usuarios a Admin (requiere confirmación de contraseña maestra).

---

## 🗄️ Estructura de Base de Datos

El proyecto utiliza un esquema relacional optimizado en PostgreSQL:

* `usuarios` 👤
* `habitaciones` 🛏️
* `reservas` 📅
* `tipos_habitacion` & `amenidades` 🏷️ *(Catálogos dinámicos)*
* `servicios` 💆‍♂️
* `consultas` 💬
* `pagos` 💳

---

## ⚡ Edge Functions (Server-Side Logic)

Para garantizar la seguridad, las operaciones críticas ocurren en el servidor:

1.  `auth-login` / `auth-register`: Autenticación segura.
2.  `create-user` / `admin-update-user`: Gestión de staff.
3.  `check-room-availability`: El cerebro que evita conflictos de fechas.
4.  `update-password` / `delete-account`: Gestión de perfil.

---

## 🚀 Despliegue

* **Frontend:** Deploy continuo (CI/CD) en **Netlify**.
* **Backend:** Cloud Functions en **Supabase**.

---

<div align="center">

**Desarrollado con ❤️ y mucho café ☕ por:**
### Flores Facundo Nestor

*Lenguaje 4 - Año 2025*

</div>
