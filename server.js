
const express = require('express'); 
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet'); // Para seguridad adicional

const app = express();

// Configuraciones de seguridad con helmet (protege contra vulnerabilidades web comunes)
app.use(helmet({
    contentSecurityPolicy: false, // Desactivado para desarrollo, activar en producción
}));

// Middleware para manejar peticiones JSON con límite aumentado
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Configuración de CORS para permitir conexiones desde cualquier origen (necesario para ngrok)
app.use(cors({
    origin: '*', // Permite cualquier origen
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.static('public')); // Para servir archivos estáticos

const { Client } = require('pg');

const db = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect()
  .then(() => console.log('✅ Conectado a PostgreSQL'))
  .catch(err => console.error('❌ Error conectando a PostgreSQL:', err));

// Middleware para loguear todas las peticiones (ayuda al debuggear con ngrok)
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// Middleware para detectar si se está accediendo vía ngrok
app.use((req, res, next) => {
    const host = req.headers.host || '';
    // Detectar si estamos usando ngrok o localhost
    const isNgrok = host.includes('ngrok');
    // Añadir esta información al objeto de request para usarla después
    req.isNgrok = isNgrok;
    // Registrar información adicional útil para depuración con ngrok
    if (isNgrok) {
        console.log(`📡 Acceso vía ngrok: ${host}`);
        console.log(`📍 Headers completos:`, req.headers);
    }
    next();
});

// Rutas principales
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "Formulario.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "Inicio-sesion.html"));
});

app.get("/usuarios", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "Usuarios.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// API para verificar el estado del servidor (útil para probar la conexión con ngrok)
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        isNgrok: req.isNgrok || false,
        host: req.headers.host
    });
});

// Ruta para registrar usuarios con validación mejorada
app.post('/register', (req, res) => {
    console.log("Recibida petición de registro:", req.body);
    const { username, email, password, rol } = req.body;
    
    // Validación mejorada
    if (!username || !email || !password) {
        return res.status(400).json({ message: "⚠️ Todos los campos son obligatorios" });
    }
    
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "⚠️ El formato del correo electrónico no es válido" });
    }
    
    // Validación básica de contraseña
    if (password.length < 6) {
        return res.status(400).json({ message: "⚠️ La contraseña debe tener al menos 6 caracteres" });
    }
    
    // Verificar si el usuario o email ya existen
    db.query('SELECT * FROM usuarios WHERE username = $1 OR email = $2', [username, email], (err, results) => {
        if (err) {
            console.error("Error SQL al verificar duplicados:", err);
            return res.status(500).json({ message: "❌ Error al verificar usuario" });
        }
        
        if (results.length > 0) {
            const isDuplicateUsername = results.some(user => user.username === username);
            const isDuplicateEmail = results.some(user => user.email === email);
            
            if (isDuplicateUsername && isDuplicateEmail) {
                return res.status(409).json({ message: "⚠️ El nombre de usuario y el correo ya están registrados" });
            } else if (isDuplicateUsername) {
                return res.status(409).json({ message: "⚠️ El nombre de usuario ya está registrado" });
            } else if (isDuplicateEmail) {
                return res.status(409).json({ message: "⚠️ El correo electrónico ya está registrado" });
            }
        }
        
        // Si pasó todas las validaciones, registrar usuario
        const sql = 'INSERT INTO usuarios (username, email, password, rol) VALUES ($1, $2, $3, $4)';
        db.query(sql, [username, email, password, rol], (err, result) => {
            if (err) {
                console.error("Error SQL al insertar:", err);
                return res.status(500).json({ message: "❌ Error al registrar usuario" });
            }
            console.log("Usuario registrado:", username, "con rol:", rol);
            res.json({ 
                message: "Usuario registrado correctamente",
                username: username,
                rol: rol
            });
        });
    });
});

// Ruta para iniciar sesión con respuesta mejorada
app.post('/login', (req, res) => {
    console.log("Recibida petición de login:", req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ message: "⚠️ Nombre de usuario y contraseña son obligatorios" });
    }
    
    // Consulta que busca por nombre de usuario O por email
    const sql = 'SELECT * FROM usuarios WHERE (username = $1 OR email = $1) AND password = $2';
    db.query(sql, [username, username, password], (err, result) => {
        if (err) {
            console.error("Error SQL en login:", err);
            return res.status(500).json({ message: "❌ Error al iniciar sesión" });
        }
        
        if (result.length > 0) {
            console.log("Login exitoso para:", username, "con rol:", result[0].rol);
            
            // Determinar la página de redirección según el rol
            let redirectUrl = '/dashboard';
            if (result[0].rol === 'administrador') {
                redirectUrl = '/admin/dashboard';
            } else if (result[0].rol === 'profesor') {
                redirectUrl = '/profesor/dashboard';
            }
            
            res.json({ 
                success: true, 
                message: "Inicio de sesión correcto",
                user: {
                    id: result[0].id,
                    username: result[0].username,
                    email: result[0].email,
                    rol: result[0].rol
                },
                redirectUrl: redirectUrl
            });
        } else {
            console.log("Login fallido para:", username);
            res.status(401).json({ success: false, message: "Nombre de usuario o contraseña incorrectos" });
        }
    });
});

// Ruta para obtener la lista de usuarios en JSON con paginación
app.get('/api/usuarios', (req, res) => {
    // Implementación básica de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    db.query('SELECT COUNT(*) as total FROM usuarios', (err, countResult) => {
        if (err) {
            console.error("Error al contar usuarios:", err);
            return res.status(500).json({ message: "❌ Error al obtener los usuarios" });
        }
        
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);
        
        db.query('SELECT id, username, email, rol, created_at FROM usuarios LIMIT $1 OFFSET $2', 
            [limit, offset], 
            (err, results) => {
                if (err) {
                    console.error("Error al listar usuarios:", err);
                    return res.status(500).json({ message: "❌ Error al obtener los usuarios" });
                }
                
                res.json({
                    users: results,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages
                    }
                });
            }
        );
    });
});

// Endpoint para datos de prueba ICFES (simulacros y estadísticas)
app.get('/api/icfes/simulacros', (req, res) => {
    res.json({
        simulacros: [
            { id: 1, nombre: "Simulacro Matemáticas", descripcion: "Prueba de aptitud numérica", dificultad: "Media" },
            { id: 2, nombre: "Simulacro Lectura Crítica", descripcion: "Prueba de comprensión de texto", dificultad: "Alta" },
            { id: 3, nombre: "Simulacro Ciencias Naturales", descripcion: "Prueba de conocimientos científicos", dificultad: "Media" }
        ]
    });
});

app.get('/api/icfes/estadisticas', (req, res) => {
    res.json({
        promedioNacional: 255,
        mejoresPuntajes: {
            matematicas: 398,
            lecturaCritica: 412,
            cienciasNaturales: 387,
            cienciasSociales: 375,
            ingles: 405
        },
        distribucionPuntajes: [
            { rango: "100-200", porcentaje: 12 },
            { rango: "201-300", porcentaje: 56 },
            { rango: "301-400", porcentaje: 28 },
            { rango: "401-500", porcentaje: 4 }
        ]
    });
});

// Obtener el puerto desde variable de entorno o usar 5000 por defecto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));


// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {  // Usar '0.0.0.0' para que escuche en todas las interfaces
    console.log(`\n📚 ICFES Prep - Plataforma de Preparación ICFES`);
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📄 Formulario de registro: http://localhost:${PORT}`);
    console.log(`🔑 Iniciar sesión: http://localhost:${PORT}/login`);
    console.log(`📋 Panel de administración: http://localhost:${PORT}/usuarios`);
    console.log(`\n📱 Para acceso remoto con ngrok: ngrok http ${PORT}`);
    console.log(`💡 Consejo: Una vez iniciado ngrok, usa la URL que proporciona para acceder desde cualquier dispositivo\n`);
});