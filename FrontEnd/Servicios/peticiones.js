export async function request(url,options={}){
 const response=await fetch(url,{...options,credentials:'same-origin'});
 const data=await response.json().catch(()=>({message:'No se pudo leer la respuesta del servidor.'}));
 if(response.status===401 && typeof window!=='undefined')window.location.assign('/');
 if(!response.ok||data?.status==='error')throw new Error(Array.isArray(data.details)?data.details.join('. '):data.message||data.statusMessage||'No se pudo completar la operación.');
 return data;
}
