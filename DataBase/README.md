# Base de datos SIAE para PostgreSQL

Esta carpeta contiene los scripts SQL para preparar la base usada por el proyecto. El nombre exacto `SIAE` coincide con el valor predeterminado de `PG_DATABASE` en `nuxt.config.ts`.

## Instalacion desde pgAdmin

1. Abre pgAdmin y conecta al servidor PostgreSQL.
2. Si aún no existe, abre el Query Tool conectado a `postgres` y ejecuta `00_crear_base.sql` una sola vez. Si ya existe, omite este paso.
3. En el navegador de pgAdmin, actualiza la lista de bases y conecta a `SIAE`.
4. Abre el Query Tool de `SIAE` y ejecuta `01_esquema.sql`.
5. Crea un archivo `.env` a partir de `.env.example` y configura `PG_USER` y `PG_PASSWORD` con tus credenciales locales de PostgreSQL.
6. Inicia el proyecto. Si la base fue creada sin comillas y aparece en pgAdmin como `siae`, cambia `PG_DATABASE` a `siae` en `.env`.

El esquema no inserta usuarios, contrasenas, carreras, semestres ni datos personales de ejemplo. Solo agrega los roles requeridos por el servidor. La aplicacion no incluye un registro publico inicial: el primer usuario `SUPERADMIN` debe aprovisionarse de forma segura antes de poder iniciar sesion y crear otras cuentas.