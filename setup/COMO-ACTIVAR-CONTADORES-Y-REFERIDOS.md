# Activar contadores y sistema de invitaciones

El sitio funciona en GitHub Pages sin servidor para navegación, WhatsApp, canal, plataformas, galería y toda la información.

Para que funcionen **visitas totales**, **conectados ahora**, **códigos de invitación** y **progreso 0/3 → 3/3**, necesitás conectar una base de datos. El proyecto está preparado para Supabase.

## 1. Crear un proyecto en Supabase

Creá un proyecto gratuito desde el panel de Supabase.

## 2. Ejecutar el SQL

Abrí **SQL Editor** y pegá todo el contenido del archivo:

`setup/supabase.sql`

Ejecutalo una sola vez.

## 3. Copiar URL y anon key

En Supabase, buscá la URL del proyecto y la **Publishable key** (`sb_publishable_...`) del proyecto. También funciona temporalmente con la clave legacy `anon`.

Abrí `config.js` y completá:

```js
supabaseUrl: "https://TU-PROYECTO.supabase.co",
supabaseAnonKey: "sb_publishable_TU_CLAVE_PUBLICA"
```

No coloques nunca una `service_role` key en GitHub ni en el navegador.

## 4. Confirmar referidos

Cuando verifiques manualmente que un amigo realmente es un usuario nuevo:

1. Supabase → **Table Editor**.
2. Abrí `dz_referral_profiles` para localizar el código y el teléfono del referente.
3. Abrí `dz_referral_confirmations`.
4. Agregá una fila nueva con ese `code`.
5. Repetí una fila por cada amigo confirmado.

La web mostrará automáticamente 1/3, 2/3 y 3/3.

`dz_referral_events` te permite ver cuántas personas abrieron el enlace o iniciaron contacto; **eso no confirma el bonus por sí solo**.

## Privacidad

El enlace compartido usa un código aleatorio tipo `DZ-A1B2C3D4E5`; el número de teléfono no aparece en la URL.

Las tablas tienen RLS activado y la web no puede listar todos los teléfonos. La función pública solo resuelve un número cuando ya se conoce su código concreto, porque se usa para prellenar el mensaje de WhatsApp "Vengo de parte de...".
