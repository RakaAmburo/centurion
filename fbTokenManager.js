import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Determina __dirname y __filename para compatibilidad con módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_PATH = path.join(__dirname, '/certs/fbtoken.json');

// Variable privada para guardar el token en memoria (RAM)
let _currentToken = null;

// --- Funciones de Persistencia (Lectura/Escritura en Disco) ---

// Lee el archivo JSON para cargar el token
function readTokenFromDisk() {
    try {
        if (fs.existsSync(STORE_PATH)) {
            // Usamos readFileSync para la lectura síncrona al inicio
            const data = fs.readFileSync(STORE_PATH, 'utf8');
            const config = JSON.parse(data);
            return config.token || null;
        }
    } catch (e) {
        // En un entorno de producción, puedes usar un logger en lugar de console.error
        console.error("Error al leer el token de disco:", e.message);
    }
    return null;
}

// Escribe el token al archivo JSON para persistencia
function writeTokenToDisk(token) {
    let resp = "Tk Saving Error!"
    try {
        const config = { token: token };
        // Usamos writeFileSync para asegurar que el token se guarda antes de continuar
        fs.writeFileSync(STORE_PATH, JSON.stringify(config, null, 2), 'utf8');
        resp = "Tk Saved!"
        console.log("Token escrito exitosamente a disco.");
    } catch (e) {
        console.error("Error al escribir el token a disco:", e.message);
    }
    return resp
}

// --- Lógica del Módulo (Exposición de funciones) ---

/**
 * Establece un nuevo token, lo guarda en memoria y en disco.
 * @param {string} newToken - El nuevo token a almacenar.
 */
export function setToken(newToken) {
    let resp = "Saving tk Error!"
    if (newToken && newToken !== _currentToken) {
        _currentToken = newToken;
        resp = writeTokenToDisk(newToken);
        
        // Aquí deberías añadir la lógica para re-inicializar el SDK de Firebase
        // usando el 'newToken' si es necesario.
        console.log(`Token actualizado en memoria: ${_currentToken.substring(0, 10)}...`);
    } else {
        resp = "Tk blank or repited!"
    }

    return resp
}

/**
 * Obtiene el token actualmente cargado en memoria.
 * @returns {string | null} El token de Firebase.
 */
export function getToken() {
    return _currentToken;
}

// --- Inicialización (Se ejecuta al iniciar el módulo) ---

// 1. Lee el token persistente al inicio y lo carga en memoria
_currentToken = readTokenFromDisk();

if (_currentToken) {
    console.log(`[INICIO] Token persistente cargado: ${_currentToken.substring(0, 10)}...`);
} else {
    console.log("[INICIO] No se encontró un token persistente.");
}

// Nota: En módulos ES, exportamos las funciones directamente.
// Ya no se usa 'module.exports'.