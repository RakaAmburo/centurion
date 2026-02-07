import admin from 'firebase-admin'
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs'; 
import { getToken } from './fbTokenManager.js'; // Importa la función del gestor de tokens

// Utilidades para simular __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importa la cuenta de servicio de forma dinámica.
// NOTA: Reemplaza esta ruta con la ruta ABSOLUTA correcta en tu Raspberry Pi.
const serviceAccountPath = path.join(__dirname, '/certs/credentials.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Inicializa Firebase Admin SDK una sola vez.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/**
 * Envía una notificación push de Firebase Cloud Messaging (FCM) a un token específico.
 * @param {string} title El título de la notificación.
 * @param {string} body El cuerpo del mensaje de la notificación.
 * @returns {Promise<string>} La respuesta exitosa del envío.
 * @throws {Error} Si el envío falla o faltan parámetros.
 */
export async function sendNotification(title, body) {
    // Usa el token pasado como argumento o el token persistente (getToken())
    const registrationToken = getToken(); 

    if (!registrationToken || !title || !body) {
        throw new Error("Faltan parámetros: Se requiere token, título y cuerpo del mensaje.");
    }
    console.log('token****************:', registrationToken);
    const message = {
        notification: {
            title: title,
            body: body
        },
        token: registrationToken,
    };
    
    try {
        const response = await admin.messaging().send(message);
        console.log('FCM Enviado exitosamente:', response);
        return response; 
    } catch (error) {
        console.error('Error enviando mensaje FCM:', error.message);
        throw new Error(`Fallo en el envío FCM: ${error.message}`);
    }
}