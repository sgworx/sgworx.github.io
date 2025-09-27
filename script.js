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
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(8, 6, 8);
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('canvas'),
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }

    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 20;
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);

        // Point light for accent
        const pointLight = new THREE.PointLight(0x4ecdc4, 0.8, 30);
        pointLight.position.set(0, 5, 0);
        this.scene.add(pointLight);
    }

    createAxes() {
        const axisLength = 6;
        const axisThickness = 0.1;
        const labelDistance = 7;

        // Define axes with their properties
        const axisConfigs = [
            { direction: new THREE.Vector3(1, 0, 0), color: 0xff6b6b, label: 'Tech/Product', position: 'right' },
            { direction: new THREE.Vector3(0, 0, 1), color: 0x4ecdc4, label: 'Design', position: 'top' },
            { direction: new THREE.Vector3(-1, 0, 0), color: 0x45b7d1, label: 'AI', position: 'left' },
            { direction: new THREE.Vector3(0, 0, -1), color: 0x96ceb4, label: 'Fabrication', position: 'bottom' }
        ];

        axisConfigs.forEach((config, index) => {
            // Create axis line
            const geometry = new THREE.CylinderGeometry(axisThickness, axisThickness, axisLength, 8);
            const material = new THREE.MeshLambertMaterial({ color: config.color });
            const axis = new THREE.Mesh(geometry, material);
            
            // Position and rotate the axis
            axis.position.copy(config.direction.clone().multiplyScalar(axisLength / 2));
            axis.lookAt(config.direction.clone().add(axis.position));
            axis.rotateX(Math.PI / 2);
            
            this.scene.add(axis);
            this.axes.push(axis);

            // Create axis tip (arrow)
            const tipGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
            const tip = new THREE.Mesh(tipGeometry, material);
            tip.position.copy(config.direction.clone().multiplyScalar(axisLength));
            tip.lookAt(config.direction.clone().add(tip.position));
            tip.rotateX(Math.PI / 2);
            
            this.scene.add(tip);

            // Create label
            this.createLabel(config.label, config.direction.clone().multiplyScalar(labelDistance), config.color);
        });

        // Create origin sphere
        const originGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const originMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const origin = new THREE.Mesh(originGeometry, originMaterial);
        origin.position.set(0, 0, 0);
        this.scene.add(origin);
    }

    createLabel(text, position, color) {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.font = 'bold 24px Arial';
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
        const loader = new THREE.GLTFLoader();
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
        // Create a simple person representation if model fails to load
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB5 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5;
        head.castShadow = true;
        group.add(head);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB5 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.4, 1, 0);
        leftArm.rotation.z = Math.PI / 4;
        leftArm.castShadow = true;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.4, 1, 0);
        rightArm.rotation.z = -Math.PI / 4;
        rightArm.castShadow = true;
        group.add(rightArm);
        
        this.personModel = group;
        this.scene.add(this.personModel);
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Camera speed control
        const cameraSpeedSlider = document.getElementById('cameraSpeed');
        if (cameraSpeedSlider) {
            cameraSpeedSlider.addEventListener('input', (e) => {
                this.cameraSpeed = parseFloat(e.target.value);
                this.controls.rotateSpeed = this.cameraSpeed;
                this.controls.zoomSpeed = this.cameraSpeed;
            });
        }

        // Reset camera button
        const resetButton = document.getElementById('resetCamera');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.camera.position.set(8, 6, 8);
                this.camera.lookAt(0, 0, 0);
                this.controls.target.set(0, 0, 0);
                this.controls.update();
            });
        }

        // Auto rotate toggle
        const autoRotateButton = document.getElementById('toggleAutoRotate');
        if (autoRotateButton) {
            autoRotateButton.addEventListener('click', () => {
                this.autoRotate = !this.autoRotate;
                this.controls.autoRotate = this.autoRotate;
                autoRotateButton.textContent = this.autoRotate ? 'Stop Auto Rotate' : 'Auto Rotate';
            });
        }

        // Axis hover effects
        const axisItems = document.querySelectorAll('.axis-item');
        axisItems.forEach((item, index) => {
            item.addEventListener('mouseenter', () => {
                if (this.axes[index]) {
                    this.axes[index].material.emissive.setHex(0x333333);
                }
            });
            
            item.addEventListener('mouseleave', () => {
                if (this.axes[index]) {
                    this.axes[index].material.emissive.setHex(0x000000);
                }
            });
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.controls.update();
        
        // Gentle rotation of the person model
        if (this.personModel) {
            this.personModel.rotation.y += 0.005;
        }
        
        // Subtle axis pulsing
        this.axes.forEach((axis, index) => {
            const time = Date.now() * 0.001;
            axis.scale.y = 1 + Math.sin(time + index) * 0.05;
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CareerGraph3D();
});
