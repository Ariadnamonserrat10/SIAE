// Tipos del adaptador PostgreSQL; no requieren cargar el cliente de MySQL.
// Las consultas antiguas todavía devuelven columnas de forma dinámica.
export interface DatabaseRow {
  [column: string]: any;
}
export interface WriteResult {
  insertId: number;
  affectedRows: number;
}
