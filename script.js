import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class MinimalCareerScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);
        this.camera = new THREE.PerspectiveCamera(
            35,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(10, 12, 10);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('canvas'),
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.enableRotate = true;
        this.controls.minDistance = 4;
        this.controls.maxDistance = 20;
        this.controls.minPolarAngle = Math.PI * 0.2;
        this.controls.maxPolarAngle = Math.PI * 0.5;
        this.controls.screenSpacePanning = false;
        // Rhino-style: right-click drag = orbit, shift+right-click = pan, left-click = disabled
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

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.createAxesAndLabels();
        this.loadPersonModel();
        this.animate();
    }

    createAxesAndLabels() {
        // Axis config: [direction, label, label offset]
        const axes = [
            [new THREE.Vector3(0, 0, 1), 'Design', new THREE.Vector3(0, 0, 1)],
            [new THREE.Vector3(1, 0, 0), 'Fabrication', new THREE.Vector3(1, 0, 0)],
            [new THREE.Vector3(0, 0, -1), 'AI', new THREE.Vector3(0, 0, -1)],
            [new THREE.Vector3(-1, 0, 0), 'Tech/Product', new THREE.Vector3(-1, 0, 0)]
        ];
        const axisLength = 6;
        const axisRadius = 0.07;
        axes.forEach(([dir, label, labelDir]) => {
            // Cylinder axis
            const geometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength, 32, 1, false);
            const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const axis = new THREE.Mesh(geometry, material);
            axis.position.set(0, 0, 0);
            axis.rotation.x = Math.PI / 2;
            if (dir.x !== 0) axis.rotation.z = Math.PI / 2;
            if (dir.z < 0 || dir.x < 0) axis.rotation.y = Math.PI;
            axis.position.add(dir.clone().multiplyScalar(axisLength / 2));
            axis.position.y = 0;
            this.scene.add(axis);

            // Label (move further out, lay flat)
            this.createLabel(label, labelDir.clone().multiplyScalar(axisLength / 2 + 0.6));
        });
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
        const modelPath = 'assets/shraddhaghuge.glb';
        loader.load(
            modelPath,
            (gltf) => {
                this.personModel = gltf.scene;
                this.personModel.position.set(0, 0.01, 0);
                this.personModel.scale.set(1, 1, 1);
                this.scene.add(this.personModel);
            },
            undefined,
            () => {
                // fallback: small black cylinder
                const geometry = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 24);
                const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
                const fallback = new THREE.Mesh(geometry, material);
                fallback.position.set(0, 0.25, 0);
                this.scene.add(fallback);
            }
        );
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MinimalCareerScene();
});
