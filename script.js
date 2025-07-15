// Initialize Three.js components
let scene, camera, renderer;
let planets = [];
let sun;
let clock = new THREE.Clock();
let paused = false;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let planetData = [];
let controls;

// Detailed planet information
const PLANET_INFO = [
    { 
        name: "Mercury", 
        color: 0x8a8a8a, 
        size: 0.4, 
        distance: 10, 
        speed: 0.01, 
        description: "The smallest planet in our solar system and closest to the Sun.",
        facts: {
            "Diameter": "4,880 km",
            "Orbit Period": "88 Earth days",
            "Surface Temp": "-173°C to 427°C",
            "Moons": "0",
            "Type": "Terrestrial"
        }
    },
    { 
        name: "Venus", 
        color: 0xe6b87e, 
        size: 0.9, 
        distance: 15, 
        speed: 0.007, 
        description: "Similar in size to Earth but with a toxic atmosphere of carbon dioxide.",
        facts: {
            "Diameter": "12,104 km",
            "Orbit Period": "225 Earth days",
            "Surface Temp": "462°C",
            "Moons": "0",
            "Type": "Terrestrial"
        }
    },
    { 
        name: "Earth", 
        color: 0x6b93d6, 
        size: 1, 
        distance: 20, 
        speed: 0.005, 
        description: "Our home planet and the only known place in the universe confirmed to host life.",
        facts: {
            "Diameter": "12,742 km",
            "Orbit Period": "365.25 days",
            "Surface Temp": "-88°C to 58°C",
            "Moons": "1 (The Moon)",
            "Type": "Terrestrial"
        }
    },
    { 
        name: "Mars", 
        color: 0xc1440e, 
        size: 0.5, 
        distance: 25, 
        speed: 0.004, 
        description: "Known as the Red Planet due to iron oxide on its surface.",
        facts: {
            "Diameter": "6,779 km",
            "Orbit Period": "687 Earth days",
            "Surface Temp": "-140°C to 20°C",
            "Moons": "2 (Phobos & Deimos)",
            "Type": "Terrestrial"
        }
    },
    { 
        name: "Jupiter", 
        color: 0xd8ca9d, 
        size: 2.5, 
        distance: 40, 
        speed: 0.002, 
        description: "The largest planet in our solar system with a Great Red Spot.",
        facts: {
            "Diameter": "139,820 km",
            "Orbit Period": "12 Earth years",
            "Surface Temp": "-108°C",
            "Moons": "79+",
            "Type": "Gas Giant"
        }
    },
    { 
        name: "Saturn", 
        color: 0xe3e0c0, 
        size: 2, 
        distance: 55, 
        speed: 0.0015, 
        description: "Famous for its beautiful ring system made of ice and rock.",
        facts: {
            "Diameter": "116,460 km",
            "Orbit Period": "29.5 Earth years",
            "Surface Temp": "-139°C",
            "Moons": "82+",
            "Type": "Gas Giant"
        }
    },
    { 
        name: "Uranus", 
        color: 0x4fd0e7, 
        size: 1.5, 
        distance: 70, 
        speed: 0.001, 
        description: "Rotates on its side with a blue-green hue from methane gas.",
        facts: {
            "Diameter": "50,724 km",
            "Orbit Period": "84 Earth years",
            "Surface Temp": "-197°C",
            "Moons": "27",
            "Type": "Ice Giant"
        }
    },
    { 
        name: "Neptune", 
        color: 0x3457d5, 
        size: 1.4, 
        distance: 85, 
        speed: 0.0008, 
        description: "The windiest planet with the strongest winds in the solar system.",
        facts: {
            "Diameter": "49,244 km",
            "Orbit Period": "165 Earth years",
            "Surface Temp": "-201°C",
            "Moons": "14",
            "Type": "Ice Giant"
        }
    }
];

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 120;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('solarSystem').appendChild(renderer.domElement);
    
    // Add orbit controls
    initOrbitControls();
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    const sunLight = new THREE.PointLight(0xffffff, 1.5, 200);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    
    // Create sun
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffff00,
        emissive: 0xffff33,
        emissiveIntensity: 0.8,
        specular: 0xffff99,
        shininess: 50
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    
    // Add glow effect to sun
    const sunGlowGeometry = new THREE.SphereGeometry(5.5, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.3
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    scene.add(sunGlow);
    
    // Create planets
    createPlanets();
    
    // Create stars
    createStars();
    
    // Generate speed controls
    generateSpeedControls();
    
    // Add event listeners
    setupEventListeners();
    
    // Start animation
    animate();
}

// Initialize orbit controls
function initOrbitControls() {
    controls = {
        enabled: true,
        dampingFactor: 0.05,
        rotateStart: new THREE.Vector2(),
        rotateEnd: new THREE.Vector2(),
        rotateDelta: new THREE.Vector2(),
        rotating: false,
        theta: Math.PI / 2,
        phi: Math.PI / 2,
        radius: 120,
        
        onMouseDown: function(event) {
            if (!this.enabled) return;
            
            event.preventDefault();
            this.rotating = true;
            this.rotateStart.set(event.clientX, event.clientY);
        },
        
        onMouseMove: function(event) {
            if (!this.enabled || !this.rotating) return;
            
            this.rotateEnd.set(event.clientX, event.clientY);
            this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
            
            const element = event.currentTarget;
            
            // Rotate left/right
            this.theta += 2 * Math.PI * this.rotateDelta.x / element.clientWidth;
            
            // Rotate up/down
            this.phi += 2 * Math.PI * this.rotateDelta.y / element.clientHeight;
            this.phi = Math.max(0, Math.min(Math.PI, this.phi));
            
            // Update camera position
            camera.position.x = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
            camera.position.y = this.radius * Math.cos(this.phi);
            camera.position.z = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
            
            camera.lookAt(scene.position);
            
            this.rotateStart.copy(this.rotateEnd);
        },
        
        onMouseUp: function() {
            this.rotating = false;
        },
        
        onMouseWheel: function(event) {
            event.preventDefault();
            this.radius -= event.deltaY * 0.01;
            this.radius = Math.max(50, Math.min(200, this.radius));
            
            // Update camera position
            camera.position.x = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
            camera.position.y = this.radius * Math.cos(this.phi);
            camera.position.z = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
            
            camera.lookAt(scene.position);
        },
        
        update: function() {
            if (this.enableDamping) {
                this.theta *= (1 - this.dampingFactor);
                this.phi *= (1 - this.dampingFactor);
            }
        }
    };
    
    // Add event listeners
    renderer.domElement.addEventListener('mousedown', (e) => controls.onMouseDown(e), false);
    renderer.domElement.addEventListener('mousemove', (e) => controls.onMouseMove(e), false);
    renderer.domElement.addEventListener('mouseup', () => controls.onMouseUp(), false);
    renderer.domElement.addEventListener('wheel', (e) => controls.onMouseWheel(e), false);
}

// Create the planets
function createPlanets() {
    PLANET_INFO.forEach((planet, index) => {
        // Create planet
        const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: planet.color,
            shininess: 30,
            emissive: 0x000000,
            emissiveIntensity: 0,
            specular: 0x111111
        });
        const planetMesh = new THREE.Mesh(geometry, material);
        
        // Position planet
        const angle = (index / PLANET_INFO.length) * Math.PI * 2;
        planetMesh.position.x = Math.cos(angle) * planet.distance;
        planetMesh.position.z = Math.sin(angle) * planet.distance;
        
        // Create orbit path
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff, 
            transparent: true,
            opacity: 0.2
        });
        
        const points = [];
        for (let i = 0; i <= 64; i++) {
            const theta = (i / 64) * Math.PI * 2;
            points.push(
                Math.cos(theta) * planet.distance,
                0,
                Math.sin(theta) * planet.distance
            );
        }
        
        orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbit);
        
        // Add to scene
        scene.add(planetMesh);
        
        // Store planet data
        planetData.push({
            mesh: planetMesh,
            orbit: orbit,
            distance: planet.distance,
            speed: planet.speed,
            angle: angle,
            name: planet.name,
            color: planet.color,
            info: planet
        });
    });
}

// Create background stars
function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });
    
    const starVertices = [];
    for (let i = 0; i < 5000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
}

// Generate speed controls UI
function generateSpeedControls() {
    const controlsContainer = document.getElementById('speedControls');
    controlsContainer.innerHTML = '';
    
    planetData.forEach((planet, index) => {
        const planetControl = document.createElement('div');
        planetControl.className = 'planet-control';
        
        planetControl.innerHTML = `
            <div class="planet-header">
                <div class="planet-color" style="background-color: #${planet.color.toString(16).padStart(6, '0')}"></div>
                <div class="planet-name">${planet.name}</div>
            </div>
            <div class="slider-container">
                <span class="slider-label">Speed:</span>
                <input type="range" min="0" max="200" value="${planet.speed * 1000}" class="slider" data-index="${index}">
                <span class="slider-value">${(planet.speed * 1000).toFixed(1)}</span>
            </div>
        `;
        
        controlsContainer.appendChild(planetControl);
    });
    
    // Add event listeners to sliders
    document.querySelectorAll('.slider').forEach(slider => {
        slider.addEventListener('input', function() {
            const index = parseInt(this.dataset.index);
            const value = parseFloat(this.value) / 1000;
            planetData[index].speed = value;
            
            // Update displayed value
            this.nextElementSibling.textContent = (value * 1000).toFixed(1);
        });
    });
}

// Set up event listeners
function setupEventListeners() {
    // Pause/resume button
    document.getElementById('pauseBtn').addEventListener('click', function() {
        paused = !paused;
        this.innerHTML = paused ? '<span class="icon">▶</span> Resume' : '<span class="icon">⏸</span> Pause';
    });
    
    // Theme toggle button
    document.getElementById('themeBtn').addEventListener('click', function() {
        const body = document.body;
        if (body.classList.contains('dark-mode')) {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            scene.background = new THREE.Color(0xc2e9fb);
            this.innerHTML = '<span class="icon">☀</span> Dark Mode';
        } else {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            scene.background = new THREE.Color(0x000011);
            this.innerHTML = '<span class="icon">🌙</span> Light Mode';
        }
    });
    
    // Panel toggle
    document.getElementById('togglePanel').addEventListener('click', function() {
        const panel = document.querySelector('.info-panel');
        panel.style.transform = panel.style.transform === 'translateX(100%)' ? 
            'translateX(0)' : 'translateX(100%)';
        this.innerHTML = panel.style.transform === 'translateX(0)' ? '<span class="icon">▶</span>' : '<span class="icon">◀</span>';
    });
    
    // Mouse move for tooltip
    window.addEventListener('mousemove', onMouseMove, false);
    
    // Window resize
    window.addEventListener('resize', onWindowResize);
}

// Handle mouse movement for tooltip
function onMouseMove(event) {
    // Calculate mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with planets
    const intersects = raycaster.intersectObjects(planetData.map(p => p.mesh));
    
    const tooltip = document.getElementById('planetTooltip');
    
    if (intersects.length > 0) {
        const planet = planetData.find(p => p.mesh === intersects[0].object);
        if (planet) {
            // Create facts HTML
            let factsHTML = '';
            if (planet.info.facts) {
                factsHTML = '<div class="planet-facts">';
                for (const [key, value] of Object.entries(planet.info.facts)) {
                    factsHTML += `
                        <div class="fact-item">
                            <span class="fact-label">${key}:</span>
                            <span class="fact-value">${value}</span>
                        </div>
                    `;
                }
                factsHTML += '</div>';
            }
            
            // Update tooltip content
            tooltip.innerHTML = `
                <h3>${planet.name}</h3>
                <p>${planet.info.description}</p>
                ${factsHTML}
            `;
            
            // Position and show tooltip
            tooltip.style.display = 'block';
            tooltip.style.left = `${event.clientX + 20}px`;
            tooltip.style.top = `${event.clientY + 20}px`;
            tooltip.classList.add('show');
            
            // Highlight the planet
            planet.mesh.material.emissive = new THREE.Color(0xffffff);
            planet.mesh.material.emissiveIntensity = 0.3;
            return;
        }
    }
    
    // Hide tooltip if no intersection
    tooltip.classList.remove('show');
    
    // Remove highlights from all planets
    planetData.forEach(p => {
        p.mesh.material.emissive = new THREE.Color(0x000000);
        p.mesh.material.emissiveIntensity = 0;
    });
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    if (!paused) {
        // Rotate sun
        sun.rotation.y += 0.001;
        
        // Update planet positions
        planetData.forEach(planet => {
            planet.angle += planet.speed * delta;
            planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
            planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
            planet.mesh.rotation.y += 0.01;
        });
        
        // Update controls
        if (controls) {
            controls.update();
        }
    }
    
    renderer.render(scene, camera);
}

// Initialize the app
window.onload = init;