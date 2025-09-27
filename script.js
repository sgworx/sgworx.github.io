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
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        // Top-down view like Rhino plan view
        this.camera.position.set(0, 10, 0);
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
        // Left mouse: Rotate around target
        // Right mouse: Pan (translate)
        // Middle mouse wheel: Zoom
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.enableRotate = true;
        
        // Zoom settings (like Rhino)
        this.controls.zoomSpeed = 1.2;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 50;
        
        // Rotation settings (like Rhino)
        this.controls.rotateSpeed = 1.0;
        this.controls.panSpeed = 1.0;
        
        // Allow full rotation (not limited like before)
        this.controls.maxPolarAngle = Math.PI;
        this.controls.minPolarAngle = 0;
        
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
        const axisLength = 4;
        const axisThickness = 0.02;
        const labelDistance = 5.5;

        // Create flat axes on the ground (Y=0) like Rhino plan view
        const axesConfigs = [
            { direction: new THREE.Vector3(1, 0, 0), color: 0x000000, label: 'Tech' },        // +X
            { direction: new THREE.Vector3(0, 0, 1), color: 0x000000, label: 'Design' },      // +Z
            { direction: new THREE.Vector3(-1, 0, 0), color: 0x000000, label: 'Fabrication' }, // -X
            { direction: new THREE.Vector3(0, 0, -1), color: 0x000000, label: 'AI' }           // -Z
        ];

        axesConfigs.forEach((config, index) => {
            // Create flat axis line on the ground
            const geometry = new THREE.BoxGeometry(axisLength, axisThickness, axisThickness);
            const material = new THREE.MeshLambertMaterial({ color: config.color });
            const axis = new THREE.Mesh(geometry, material);
            
            // Position the axis flat on the ground (Y=0)
            axis.position.set(0, 0, 0);
            
            // Position the axis along its direction
            axis.position.copy(config.direction.clone().multiplyScalar(axisLength / 2));
            
            // Rotate to align with direction
            const angle = Math.atan2(config.direction.x, config.direction.z);
            axis.rotation.y = angle;
            
            this.scene.add(axis);
            this.axes.push(axis);

            // Create label
            this.createLabel(config.label, config.direction.clone().multiplyScalar(labelDistance), config.color);
        });
    }

    createCrossingLines() {
        // Remove crossing lines for clean plan view
    }

    createLabel(text, position, color) {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(255, 255, 255, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = '#000000';
        context.font = 'bold 24px Helvetica Neue, Helvetica, Arial, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        
        sprite.position.copy(position);
        sprite.scale.set(2, 0.5, 1);
        
        this.scene.add(sprite);
        this.labels.push(sprite);
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
                    this.personModel.scale.set(0.5, 0.5, 0.5);
                    this.personModel.position.set(0, 0, 0);
                    
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
        // Create a simple person representation if model fails to load - black and white only
        const group = new THREE.Group();
        
        // Body - black
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        group.add(body);
        
        // Head - black
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5;
        group.add(head);
        
        // Arms - black
        const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.4, 1, 0);
        leftArm.rotation.z = Math.PI / 4;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.4, 1, 0);
        rightArm.rotation.z = -Math.PI / 4;
        group.add(rightArm);
        
        this.personModel = group;
        this.scene.add(this.personModel);
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
