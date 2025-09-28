import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class CareerGraph3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.personModel = null;
        this.axes = [];
        this.labels = [];
        this.autoRotate = false;
        this.cameraSpeed = 1;
        
        this.init();
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupLights();
        this.createAxes();
        this.setupEventListeners();
        this.loadPersonModel();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            35,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(10, 12, 10);
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('canvas'),
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = false;
        this.renderer.toneMapping = THREE.NoToneMapping;
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        
        // Rhino-style navigation settings
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        
        // Mouse controls (like Rhino):
        // Right-click drag → Orbit/rotate camera around the origin
        // Shift + right-click drag → Pan camera
        // Scroll wheel → Smooth zoom in/out
        // Left-click drag → Disabled (no effect)
        this.controls.mouseButtons.LEFT = null;
        this.controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
        this.controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
        this.controls.touches.ONE = null;
        this.controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
        
        // Pan with shift+right
        this.controls.keys = {
            LEFT: 'ArrowLeft',
            UP: 'ArrowUp',
            RIGHT: 'ArrowRight',
            BOTTOM: 'ArrowDown'
        };
        
        // Limits for controls
        this.controls.minDistance = 4;
        this.controls.maxDistance = 20;
        this.controls.minPolarAngle = Math.PI * 0.2;
        this.controls.maxPolarAngle = Math.PI * 0.5;
        this.controls.screenSpacePanning = false;
        
        // No auto-rotate
        this.controls.autoRotate = false;
        
        // Set initial target to origin
        this.controls.target.set(0, 0, 0);
    }

    setupLights() {
        // Simple white lighting for black and white only
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);
    }

    createAxes() {
        const axisLength = 1.2;
        const axisRadius = 0.04;
        
        // Create centered cross made of four thick black lines on the ground plane (Y=0)
        const axesConfigs = [
            { direction: new THREE.Vector3(0, 0, 1), label: 'Design' },        // Top (positive Z)
            { direction: new THREE.Vector3(1, 0, 0), label: 'Fabrication' },   // Right (positive X)
            { direction: new THREE.Vector3(0, 0, -1), label: 'AI' },        // Bottom (negative Z)
            { direction: new THREE.Vector3(-1, 0, 0), label: 'Tech/Product' }  // Left (negative X)
        ];

        axesConfigs.forEach((config, index) => {
            // Create thick cylindrical axis
            const geometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength, 32, 1, false);
            const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const axis = new THREE.Mesh(geometry, material);
            
            // Position the axis at the origin
            axis.position.set(0, 0, 0);
            
            // Rotate to lay flat on the ground
            axis.rotation.x = Math.PI / 2;
            if (config.direction.x !== 0) axis.rotation.z = Math.PI / 2;
            if (config.direction.z < 0 || config.direction.x < 0) axis.rotation.y = Math.PI;
            
            // Position the axis along its direction
            axis.position.add(config.direction.clone().multiplyScalar(axisLength / 2));
            axis.position.y = 0;
            
            this.scene.add(axis);
            this.axes.push(axis);

            // Create label at the end of the axis
            const labelPosition = config.direction.clone().multiplyScalar(axisLength / 2 + 0.2);
            this.createLabel(config.label, labelPosition);
        });
    }

    createCrossingLines() {
        // Remove crossing lines for clean plan view
    }

    createLabel(text, pos) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 36px Helvetica Neue, Helvetica, Arial, sans-serif';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(pos);
        sprite.position.y = 0.01; // Slightly above ground
        sprite.scale.set(2.5, 0.35, 1);
        sprite.rotation.x = -Math.PI / 2; // Lay flat on ground
        this.scene.add(sprite);
    }

    loadPersonModel() {
        const loader = new GLTFLoader();
        // Try multiple possible paths for the model
        const possiblePaths = [
            'C:/Dev/whoisshraddha/assets/shraddhaghuge.glb',
            '../whoisshraddha/assets/shraddhaghuge.glb',
            './assets/shraddhaghuge.glb',
            'assets/shraddhaghuge.glb'
        ];
        
        let currentPathIndex = 0;
        
        const tryLoadModel = () => {
            if (currentPathIndex >= possiblePaths.length) {
                console.warn('Could not load model from any path, using fallback');
                this.createFallbackPerson();
                this.hideLoading();
                return;
            }
            
            const modelPath = possiblePaths[currentPathIndex];
            console.log(`Attempting to load model from: ${modelPath}`);
            
            loader.load(
                modelPath,
                (gltf) => {
                    this.personModel = gltf.scene;
                    this.personModel.position.set(0, 0.01, 0);
                    this.personModel.scale.set(0.18, 0.18, 0.18);
                    
                    // Enable shadows
                    this.personModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    this.scene.add(this.personModel);
                    this.hideLoading();
                    console.log('Model loaded successfully from:', modelPath);
                },
                (progress) => {
                    if (progress.total > 0) {
                        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
                    }
                },
                (error) => {
                    console.warn(`Failed to load model from ${modelPath}:`, error);
                    currentPathIndex++;
                    tryLoadModel();
                }
            );
        };
        
        tryLoadModel();
    }

    createFallbackPerson() {
        // fallback: small black cylinder
        const geometry = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 24);
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const fallback = new THREE.Mesh(geometry, material);
        fallback.position.set(0, 0.25, 0);
        this.scene.add(fallback);
    }

    hideLoading() {
        // No loading screen in minimal design
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Only update controls if they exist
        if (this.controls) {
            this.controls.update();
        }
        
        // Gentle rotation of the person model
        if (this.personModel) {
            this.personModel.rotation.y += 0.005;
        }
        
        // No animation for clean plan view
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        new CareerGraph3D();
    } catch (error) {
        console.error('Failed to initialize CareerGraph3D:', error);
        document.body.innerHTML = '<div style="text-align: center; padding: 50px; font-family: Helvetica Neue; color: #333;"><h2>Loading Error</h2><p>Failed to load 3D visualization. Please refresh the page.</p></div>';
    }
});
