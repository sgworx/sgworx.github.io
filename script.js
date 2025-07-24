class Scene3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = null;
        this.models = [];
        this.isLoading = true;
        this.selectedModel = null;
        this.originalPositions = [];
        
        this.modelFiles = [
            'Assets/1.glb',
            'Assets/2.glb',
            'Assets/3.glb',
            'Assets/4.glb',
            'Assets/5.glb'
        ];
        
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 20); // Camera pulled back even further for extremely wide layout
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        // Create controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = false;
        this.controls.autoRotate = true; // Enable auto-rotation
        this.controls.autoRotateSpeed = 0.5; // Rotation speed like BAM Works
        
        // Setup raycaster for object selection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Add lighting
        this.setupLighting();
        
        // Load models
        this.loadModels();
        
        // Start animation loop
        this.animate();
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Point light for better illumination
        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(-10, -10, -5);
        this.scene.add(pointLight);
    }
    
    async loadModels() {
        const loader = new THREE.GLTFLoader();
        
        for (let i = 0; i < this.modelFiles.length; i++) {
            try {
                console.log(`Loading model: ${this.modelFiles[i]}`);
                const gltf = await this.loadModel(loader, this.modelFiles[i]);
                this.models.push(gltf);
                
                // Position each model in a BAM Works style arrangement
                const model = gltf.scene;
                this.scene.add(model);
                this.positionModelBAMStyle(model, i);
                this.centerAndScaleModel(model);
                this.addFloatingAnimation(model, i);
                
                // Store original position for reset
                this.originalPositions.push({
                    x: model.position.x,
                    y: model.position.y,
                    z: model.position.z,
                    scale: model.scale.clone()
                });
                
                console.log(`Successfully loaded model ${i + 1}: ${this.modelFiles[i]}`);
            } catch (error) {
                console.error(`Error loading model ${this.modelFiles[i]}:`, error);
                console.log(`Skipping model ${i + 1} due to loading error`);
            }
        }
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            this.isLoading = false;
            console.log(`Loaded ${this.models.length} models successfully`);
        }, 1000);
    }
    
    positionModelBAMStyle(model, index) {
        // Position models in a single horizontal row with very, very wide spacing to ensure no overlap
        const spacing = 40; // Very, very wide spacing for large, non-overlapping models
        const startX = -(this.modelFiles.length - 1) * spacing / 2;
        const x = startX + index * spacing;
        
        model.position.set(x, 0, 0); // All models at y=0 and z=0 for a clean horizontal row
    }
    
    loadModel(loader, url) {
        return new Promise((resolve, reject) => {
            loader.load(
                url,
                (gltf) => {
                    resolve(gltf);
                },
                (progress) => {
                    console.log(`Loading progress: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }
    
    centerAndScaleModel(model) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Center the model
        model.position.sub(center);
        
        // Scale to fit in view - significantly larger scale
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 10.0 / maxDim; // Significantly larger scale for better visibility
        model.scale.setScalar(scale);
    }
    
    addFloatingAnimation(model, index) {
        const originalY = model.position.y;
        const amplitude = 0.2; // Subtle floating
        const speed = 0.001 + (index * 0.0003); // Different speeds for each model
        
        model.userData.animation = {
            originalY: originalY,
            amplitude: amplitude,
            speed: speed,
            time: Math.random() * Math.PI * 2 + (index * Math.PI / 4) // Staggered start times
        };
    }
    
    onMouseClick(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            // Find which model was clicked
            let clickedModel = null;
            for (let intersect of intersects) {
                // Traverse up the parent chain to find the root model
                let current = intersect.object;
                while (current.parent && current.parent !== this.scene) {
                    current = current.parent;
                }
                
                // Check if this is one of our loaded models
                for (let modelData of this.models) {
                    if (modelData.scene === current) {
                        clickedModel = current;
                        break;
                    }
                }
                if (clickedModel) break;
            }
            
            if (clickedModel) {
                this.handleModelClick(clickedModel);
            }
        }
    }
    
    handleModelClick(model) {
        // Reset all models to original state
        this.resetAllModels();
        
        // Animate the clicked model
        this.animateModelFocus(model);
        
        // Update selected model
        this.selectedModel = model;
    }
    
    resetAllModels() {
        this.models.forEach((modelData, index) => {
            const model = modelData.scene;
            const original = this.originalPositions[index];
            
            if (original) {
                // Reset position and scale
                model.position.set(original.x, original.y, original.z);
                model.scale.copy(original.scale);
            }
        });
    }
    
    animateModelFocus(model) {
        // Create a focus animation for the selected model
        const targetScale = 1.5;
        const targetY = 0;
        
        // Animate scale and position
        const scaleTween = new TWEEN.Tween(model.scale)
            .to({ x: targetScale, y: targetScale, z: targetScale }, 800)
            .easing(TWEEN.Easing.Quadratic.Out);
            
        const positionTween = new TWEEN.Tween(model.position)
            .to({ y: targetY }, 800)
            .easing(TWEEN.Easing.Quadratic.Out);
            
        scaleTween.start();
        positionTween.start();
    }
    
    setupEventListeners() {
        // Mouse click for object selection
        window.addEventListener('click', (event) => {
            this.onMouseClick(event);
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Mouse wheel for zoom
        document.addEventListener('wheel', (event) => {
            event.preventDefault();
            const zoomSpeed = 0.1;
            const delta = event.deltaY > 0 ? 1 : -1;
            this.camera.position.multiplyScalar(1 + delta * zoomSpeed);
        });
        
        // Touch support for mobile
        window.addEventListener('touchend', (event) => {
            event.preventDefault();
            this.onMouseClick(event.changedTouches[0]);
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (!this.isLoading) {
            // Update floating animation for all models
            this.models.forEach((modelData, index) => {
                const model = modelData.scene;
                if (model && model.userData.animation) {
                    const anim = model.userData.animation;
                    anim.time += anim.speed;
                    model.position.y = anim.originalY + Math.sin(anim.time) * anim.amplitude;
                }
            });
            
            // Update TWEEN animations
            TWEEN.update();
            
            // Update controls
            this.controls.update();
            
            // Render
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Initialize the scene when the page loads
window.addEventListener('load', () => {
    new Scene3D();
}); 