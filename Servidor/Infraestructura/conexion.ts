import pg from 'pg';
import { useRuntimeConfig } from '#imports';
let conexion:pg.Pool|undefined;
export function baseDeDatos(){
  const config=useRuntimeConfig();
  conexion ??= new pg.Pool({host:config.databaseHost,port:Number(config.databasePort),user:config.databaseUser,password:config.databasePassword || undefined,database:config.databaseName,max:5,connectionTimeoutMillis:5000});
  return conexion;
}
