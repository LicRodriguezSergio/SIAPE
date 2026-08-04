# SIAPE V3 – versión de prueba

Esta versión conserva el diseño y las funciones de SIAPE V2 y agrega:

- Autenticación Firebase por correo y contraseña.
- Roles `auditor` y `administrador`.
- Registro mínimo de accesos en Firestore.
- Panel personal del auditor.
- Fotografías por requisito/desvío, guardadas en IndexedDB del dispositivo.
- Informe con evidencia fotográfica.
- Compartir por correo, WhatsApp o menú nativo del dispositivo.
- Respaldo completo local de auditorías y fotografías.
- PWA y Motor IA existentes.

## Configuración obligatoria antes de publicar

1. Crear un proyecto en Firebase.
2. Activar Authentication > Correo/contraseña.
3. Crear una aplicación Web y copiar la configuración en `firebase-config.js`.
4. Crear Firestore Database y publicar las reglas incluidas en `firestore.rules`.
5. Crear cada usuario en Authentication.
6. En Firestore crear `users/{UID}` con:

```json
{ "name": "Nombre del auditor", "role": "auditor", "active": true }
```

Para Sergio, usar `role: "administrador"`.

## Privacidad

Firestore recibe solamente identidad y eventos de acceso. Las auditorías, observaciones, informes y fotografías permanecen localmente en el navegador del dispositivo. Al compartir, el usuario elige voluntariamente la aplicación y el destinatario.

## Prueba local

Al abrir el proyecto desde `localhost` aparece un botón de modo local de prueba. Ese botón no se muestra en GitHub Pages.
