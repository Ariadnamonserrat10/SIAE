-- Ejecutar conectado a la base postgres en pgAdmin.
-- Luego conectar pgAdmin a la base SIAE y ejecutar 01_esquema.sql.
CREATE DATABASE "SIAE"
    WITH
    ENCODING = 'UTF8'
    TEMPLATE = template0;