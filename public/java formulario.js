document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("registroForm");
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.querySelector(".toggle-password");
    const progressBar = document.querySelector(".progress-bar");
    const notification = document.getElementById("mensaje");
    
    // Detectar si estamos usando ngrok para ajustar las URLs
    const isNgrokOrRemote = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    // Verificar conexión al servidor (útil para ngrok)
    async function checkServerConnection() {
        try {
            const response = await fetch(`${getBaseApiUrl()}/api/status`);
            const data = await response.json();
            console.log("📡 Conexión al servidor:", data);
            
            // Mostrar banner de conexión si estamos en ngrok
            if (isNgrokOrRemote) {
                const connectionBanner = document.createElement('div');
                connectionBanner.className = 'connection-banner';
                connectionBanner.innerHTML = `
                    <i class="fas fa-wifi"></i> 
                    Conectado remotamente a ICFES Supérior
                    <span class="connection-status">✅ Servidor en línea</span>
                `;
                document.body.prepend(connectionBanner);
                
                // Mostrar animación y luego ocultar
                setTimeout(() => {
                    connectionBanner.classList.add('show');
                    setTimeout(() => {
                        connectionBanner.classList.add('hide');
                        setTimeout(() => connectionBanner.remove(), 500);
                    }, 3000);
                }, 500);
            }
        } catch (error) {
            console.error("❌ Error de conexión al servidor:", error);
            if (isNgrokOrRemote) {
                showNotification("Hay problemas de conexión con el servidor. Verifica tu conexión a internet.", "error");
            }
        }
    }
    
    // Ejecutar verificación de conexión
    checkServerConnection();
    
    // Función para determinar la URL base para peticiones API
    function getBaseApiUrl() {
        // Si estamos en localhost, usar el puerto específico
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return "http://127.0.0.1:5000";
        }
        // Si estamos en ngrok o un servidor remoto, usar la URL actual
        return window.location.origin;
    }
    
    // Toggle password visibility con mejoras visuales
    if (togglePassword) {
        togglePassword.addEventListener("click", function () {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            
            // Efecto visual mejorado al cambiar el ícono
            this.classList.add('toggled');
            setTimeout(() => this.classList.remove('toggled'), 300);
            
            this.innerHTML = type === "password" ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Función mejorada para mostrar notificaciones
    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = 'notification'; // Resetear clases
        notification.classList.add('show', type);
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
    
    // Form validation animation and progress tracking with improved feedback
    function updateProgress() {
        let progress = 0;
        let requiredFields = 3; // username, email, password
        let validCount = 0;
        
        // Validación de nombre de usuario: al menos 4 caracteres
        const isUsernameValid = usernameInput.value.length >= 4;
        if (isUsernameValid) validCount++;
        
        // Validación de email con regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmailValid = emailInput.value.length > 0 && emailRegex.test(emailInput.value);
        if (isEmailValid) validCount++;
        
        // Validación de contraseña: al menos 6 caracteres, recomendado con números y símbolos
        const isPasswordStrong = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/.test(passwordInput.value);
        const isPasswordValid = passwordInput.value.length >= 6;
        if (isPasswordValid) validCount++;
        
        // Calculo de progreso basado en campos válidos
        progress = (validCount / requiredFields) * 100;
        
        // Actualizar barra de progreso con color variable según el progreso
        progressBar.style.width = `${progress}%`;
        if (progress < 50) {
            progressBar.style.background = 'linear-gradient(90deg, #ff4b4b, #ff9b4b)';
        } else if (progress < 100) {
            progressBar.style.background = 'linear-gradient(90deg, #ffdb4b, #4bff5e)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #4bff5e, #4bb8ff)';
            progressBar.classList.add('pulse-animation');
        }
        
        // Validación visual con mensajes de ayuda
        validateInput(usernameInput, isUsernameValid, isUsernameValid ? 
                     "Nombre de usuario válido" : "Mínimo 4 caracteres");
        
        validateInput(emailInput, isEmailValid, isEmailValid ? 
                     "Correo electrónico válido" : "Ingresa un correo válido");
        
        if (passwordInput.value.length > 0) {
            validateInput(passwordInput, isPasswordValid, 
                isPasswordStrong ? "Contraseña segura" : 
                isPasswordValid ? "Contraseña aceptable" : "Mínimo 6 caracteres");
            
            // Mostrar nivel de seguridad para la contraseña
            const passwordFeedback = document.querySelector(".password-strength") || 
                  createPasswordStrengthIndicator();
            
            if (isPasswordStrong) {
                passwordFeedback.textContent = "Seguridad: Alta";
                passwordFeedback.className = "password-strength high";
            } else if (isPasswordValid) {
                passwordFeedback.textContent = "Seguridad: Media";
                passwordFeedback.className = "password-strength medium";
            } else {
                passwordFeedback.textContent = "Seguridad: Baja";
                passwordFeedback.className = "password-strength low";
            }
        }
        
        // Activar/desactivar botón según si el formulario está completo
        const submitBtn = document.querySelector(".submit-btn");
        if (submitBtn) {
            submitBtn.disabled = validCount < requiredFields;
            submitBtn.classList.toggle("disabled", validCount < requiredFields);
        }
    }
    
    // Crear indicador de fuerza de contraseña
    function createPasswordStrengthIndicator() {
        const indicator = document.createElement("div");
        indicator.className = "password-strength";
        const passwordGroup = document.querySelector("input[type=password]").parentElement;
        passwordGroup.appendChild(indicator);
        return indicator;
    }
    
    // Función mejorada para validar cada input con mensajes de ayuda
    function validateInput(input, isValid, message) {
        const validationIcon = input.parentElement.querySelector(".input-validation");
        const validationMessage = input.parentElement.querySelector(".validation-message") || 
                                  createValidationMessage(input.parentElement);
        
        if (input.value.length > 0) {
            validationIcon.style.opacity = "1";
            validationMessage.style.display = "block";
            validationMessage.textContent = message;
            
            if (isValid) {
                validationIcon.innerHTML = '<i class="fas fa-check-circle" style="color: #4caf50;"></i>';
                validationMessage.className = "validation-message valid";
            } else {
                validationIcon.innerHTML = '<i class="fas fa-times-circle" style="color: #f44336;"></i>';
                validationMessage.className = "validation-message invalid";
            }
        } else {
            validationIcon.style.opacity = "0";
            validationMessage.style.display = "none";
        }
    }
    
    // Crear elemento para mensajes de validación
    function createValidationMessage(parent) {
        const message = document.createElement("div");
        message.className = "validation-message";
        parent.appendChild(message);
        return message;
    }
    
    // Add input event listeners con debounce para mejor rendimiento
    let debounceTimeout;
    const debounceValidation = () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(updateProgress, 100);
    };
    
    usernameInput?.addEventListener("input", debounceValidation);
    emailInput?.addEventListener("input", debounceValidation);
    passwordInput?.addEventListener("input", debounceValidation);
    
    // Add focus effects con animación mejorada
    const inputs = document.querySelectorAll(".input-group input, .input-group select");
    
    inputs.forEach(input => {
        input.addEventListener("focus", () => {
            input.parentElement.classList.add("focused");
            input.parentElement.style.transform = "translateY(-5px)";
        });
        
        input.addEventListener("blur", () => {
            input.parentElement.classList.remove("focused");
            input.parentElement.style.transform = "translateY(0)";
        });
    });

    // Form submission con manejo mejorado para ngrok
if (form) {
    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        
        // Button loading state
        const submitBtn = document.querySelector(".submit-btn");
        const btnText = submitBtn.querySelector(".btn-text");
        const originalText = btnText.textContent;
        const btnIcon = submitBtn.querySelector(".btn-icon");
        
        btnText.textContent = "Procesando...";
        btnIcon.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.7";
        
        const userData = {
            username: usernameInput.value,
            email: emailInput.value,
            password: passwordInput.value,
            rol: document.getElementById("rol").value
        };
        
        // Usar la URL base apropiada según si estamos en ngrok o local
        const apiUrl = `${getBaseApiUrl()}/register`;
        console.log(`📤 Enviando solicitud a: ${apiUrl}`);
        
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            
            // Reset button state
            btnText.textContent = originalText;
            btnIcon.innerHTML = '<i class="fas fa-arrow-right"></i>';
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";
            
            // Manejar la respuesta
            if (response.ok) {
                showNotification(`¡Bienvenido a ICFES Supérate! Tu cuenta de ${result.rol} ha sido creada con éxito`, "success");
                
                // Animación de éxito y redirección
                document.querySelector(".container").classList.add("success-animation");
                setTimeout(() => {
                    // MODIFICADO: Guardar MÁS información para la redirección a la app
                    localStorage.setItem('icfesUser', JSON.stringify({
                        username: result.username,
                        rol: result.rol,
                        isNew: true,
                        // NUEVO: Agregar token y email para la redirección
                        token: result.token || generateTemporaryToken(), // Si el backend no devuelve token
                        email: result.email || userData.email,
                        registeredAt: new Date().toISOString()
                    }));
                    
                    window.location.href = "/exito.html";
                }, 1500);
            } else {
                showNotification(result.message || "Error en el registro", "error");
                document.querySelector(".container").classList.add("shake");
                setTimeout(() => {
                    document.querySelector(".container").classList.remove("shake");
                }, 600);
            }
        } catch (error) {
            console.error("Error de red:", error);
            
            // Reset button state
            btnText.textContent = originalText;
            btnIcon.innerHTML = '<i class="fas fa-arrow-right"></i>';
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";
            
            // Mostrar mensaje específico para problemas de conectividad (común en ngrok)
            if (!navigator.onLine) {
                showNotification("Sin conexión a internet. Verifica tu conexión y vuelve a intentarlo.", "error");
            } else if (isNgrokOrRemote) {
                showNotification("Error de conexión con el servidor. Si estás usando ngrok, verifica que el túnel siga activo.", "error");
            } else {
                showNotification("Hubo un problema con el registro. Intenta nuevamente más tarde.", "error");
            }
            
            document.querySelector(".container").classList.add("shake");
            setTimeout(() => {
                document.querySelector(".container").classList.remove("shake");
            }, 600);
        }
    });
}

// NUEVA FUNCIÓN: Para generar token temporal si el backend no lo devuelve
function generateTemporaryToken() {
    return 'temp_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}
    
    // Inicialización para formularios de login
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            
            // Button loading state
            const submitBtn = document.querySelector(".submit-btn");
            const btnText = submitBtn.querySelector(".btn-text");
            const originalText = btnText.textContent;
            const btnIcon = submitBtn.querySelector(".btn-icon");
            
            btnText.textContent = "Iniciando sesión...";
            btnIcon.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.7";
            
            try {
                const response = await fetch(`${getBaseApiUrl()}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });
                
                const result = await response.json();
                
                // Reset button state
                btnText.textContent = originalText;
                btnIcon.innerHTML = '<i class="fas fa-sign-in-alt"></i>';
                submitBtn.disabled = false;
                submitBtn.style.opacity = "1";
                
                if (response.ok && result.success) {
                    // Almacenar información del usuario en localStorage
                    localStorage.setItem('icfesUser', JSON.stringify({
                        id: result.user.id,
                        username: result.user.username,
                        email: result.user.email,
                        rol: result.user.rol
                    }));
                    
                    showNotification(`Bienvenido de nuevo, ${result.user.username}`, "success");
                    
                    // Animación de éxito antes de redirección
                    document.querySelector(".container").classList.add("success-animation");
                    setTimeout(() => {
                        // Redirigir según el rol del usuario
                        window.location.href = result.redirectUrl || "/dashboard";
                    }, 1500);
                } else {
                    showNotification(result.message || "Credenciales incorrectas", "error");
                    document.querySelector(".container").classList.add("shake");
                    setTimeout(() => {
                        document.querySelector(".container").classList.remove("shake");
                    }, 600);
                }
            } catch (error) {
                console.error("Error de red:", error);
                
                // Reset button state
                btnText.textContent = originalText;
                btnIcon.innerHTML = '<i class="fas fa-sign-in-alt"></i>';
                submitBtn.disabled = false;
                submitBtn.style.opacity = "1";
                
                // Mostrar mensaje específico para problemas de ngrok
                if (isNgrokOrRemote) {
                    showNotification("Error de conexión con el servidor. Si estás usando ngrok, verifica que el túnel siga activo.", "error");
                } else {
                    showNotification("Error al intentar iniciar sesión. Intenta nuevamente.", "error");
                }
                
                document.querySelector(".container").classList.add("shake");
                setTimeout(() => {
                    document.querySelector(".container").classList.remove("shake");
                }, 600);
            }
        });
    }
    
    // Initialize progress bar on load if we're on the registration page
    if (form) {
        updateProgress();
    }
    
    // Mostrar temas ICFES en áreas de contenido si existen
    const icfesTopicsContainer = document.getElementById("icfes-topics");
    if (icfesTopicsContainer) {
        const topics = [
            { name: "Matemáticas", icon: "calculator" },
            { name: "Lectura Crítica", icon: "book-open" },
            { name: "Ciencias Naturales", icon: "flask" },
            { name: "Ciencias Sociales", icon: "globe-americas" },
            { name: "Inglés", icon: "language" }
        ];
        
        // Crear elementos para cada tema del ICFES
        topics.forEach(topic => {
            const topicElement = document.createElement("div");
            topicElement.className = "icfes-topic-card";
            topicElement.innerHTML = `
                <i class="fas fa-${topic.icon}"></i>
                <h3>${topic.name}</h3>
                <p>Prepárate para dominar esta área del ICFES</p>
                <button class="topic-btn">Explorar</button>
            `;
            icfesTopicsContainer.appendChild(topicElement);
            
            // Añadir efecto hover
            topicElement.addEventListener("mouseenter", () => {
                topicElement.classList.add("hover");
            });
            topicElement.addEventListener("mouseleave", () => {
                topicElement.classList.remove("hover");
            });
        });
    }
});