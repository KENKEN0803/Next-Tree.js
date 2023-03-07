/*global mainViewModel,ko*/
import * as THREE from '../node_modules/three/build/three.module.js';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {DRACOLoader} from "three/addons/loaders/DRACOLoader";
import {KTX2Loader} from "three/addons/loaders/KTX2Loader";
import {OrbitControls} from "three/addons/controls/OrbitControls";
import {RGBELoader} from "three/addons/loaders/RGBELoader";

export class ThreeView {
    constructor() {
        // Tracks if this engine is currently the active engine.
        this._enabled = false;

        this._container = null;
        this._camera = null;
        this._clock = null;
        this._scene = null;
        this._renderer = null;
        this._mixer = null;
        this._orbitControls = null;
        this._backgroundSubscription = undefined;
    }

    _subscribeToAnimUI(anim) {
        anim.active.subscribe(function(newValue) {
            mainViewModel.anyAnimChanged();
            const action = anim.clipAction;
            if (!newValue) {
                action.stop();
            } else {
                action.play();
            }
        });
    }

    _initScene(rootPath, gltfContent) {
        this._clock = new THREE.Clock();

        this._container = document.getElementById('threeContainer');

        const scene = this._scene = new THREE.Scene();

        // Note: The near and far planes can be set this way due to the use of "logarithmicDepthBuffer" in the renderer below.
        const camera = this._camera = new THREE.PerspectiveCamera(45, this._container.offsetWidth / this._container.offsetHeight, 1e-5, 1e10);

        scene.add(camera);

        // RENDERER
        const renderer = this._renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
        renderer.setClearColor(0x222222);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputEncoding = THREE.sRGBEncoding;

        this._container.appendChild(renderer.domElement);

        const loader = new GLTFLoader();

        const dracoLoaderPathAndFile = document.getElementById('dracoLoaderPath').textContent;
        // Replace a slash followed by anything but a slash, to the end, with just a slash.
        const dracoLoaderPath = dracoLoaderPathAndFile.replace(/\/[^\/]*$/, '/');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath(dracoLoaderPath);

        loader.setDRACOLoader( dracoLoader );

        const extensionRootPath = document.getElementById('extensionRootPath').textContent;
        const basisPath = extensionRootPath + '/node_modules/three/examples/js/libs/basis/';
        loader.setKTX2Loader( new KTX2Loader().setTranscoderPath( basisPath ).detectSupport( renderer ) );

        const cameraPos = new THREE.Vector3(-0.2, 0.4, 1.4);
        const orbitControls = this._orbitControls = new OrbitControls(this._camera, renderer.domElement);

        loader.parse(gltfContent, rootPath, data => {
            const gltf = data;
            const object = gltf.scene;

            const defaultThreeReflection = document.getElementById('defaultThreeReflection').textContent.split('{face}');
            let envMap;
            const envPath = defaultThreeReflection[0];
            if (defaultThreeReflection.length === 2) {
                // Backwards compatibility for older, standard dynamic range backgrounds.
                const envFormat = defaultThreeReflection[1];

                envMap = new THREE.CubeTextureLoader().load([
                    envPath + 'posx' + envFormat, envPath + 'negx' + envFormat,
                    envPath + 'posy' + envFormat, envPath + 'negy' + envFormat,
                    envPath + 'posz' + envFormat, envPath + 'negz' + envFormat
                ]);
                envMap.format = THREE.RGBFormat;
                scene.environment = envMap;
            } else {
                // Recommended path: HDR environments have details revealed by bright and dark reflective surfaces on models.
                const pmremGenerator = new THREE.PMREMGenerator( renderer );
                pmremGenerator.compileEquirectangularShader();

                new RGBELoader()
                    .setDataType(THREE.HalfFloatType)
                    .load(envPath, (texture) => {
                        envMap = pmremGenerator.fromEquirectangular(texture).texture;
                        pmremGenerator.dispose();
                        scene.environment = envMap;
                        applyBackground(mainViewModel.showBackground());
                    });
            }

            mainViewModel.hasBackground(true);
            function applyBackground(showBackground) {
                scene.background = showBackground ? envMap : null;
            }
            applyBackground(mainViewModel.showBackground());
            this._backgroundSubscription = mainViewModel.showBackground.subscribe(applyBackground);

            // Center the model on screen based on bounding box information.
            object.updateMatrixWorld();
            const boundingBox = new THREE.Box3().setFromObject(object);
            const modelSizeVec3 = new THREE.Vector3();
            boundingBox.getSize(modelSizeVec3);
            const modelSize = modelSizeVec3.length();
            const modelCenter = new THREE.Vector3();
            boundingBox.getCenter(modelCenter);

            // Set up mouse orbit controls.
            orbitControls.reset();
            orbitControls.maxDistance = modelSize * 50;
            orbitControls.enableDamping = true;
            orbitControls.dampingFactor = 0.07;
            orbitControls.rotateSpeed = 1.25;
            orbitControls.panSpeed = 1.25;
            orbitControls.screenSpacePanning = true;

            // Position the camera accordingly.
            object.position.x = -modelCenter.x;
            object.position.y = -modelCenter.y;
            object.position.z = -modelCenter.z;
            camera.position.copy(modelCenter);
            camera.position.x += modelSize * cameraPos.x;
            camera.position.y += modelSize * cameraPos.y;
            camera.position.z += modelSize * cameraPos.z;
            camera.near = modelSize / 100;
            camera.far = modelSize * 100;
            camera.updateProjectionMatrix();
            camera.lookAt(modelCenter);

            // Set up UI controls for any animations in the model.
            const gltfAnimations = gltf.animations;
            const koAnimations = [];
            if (gltfAnimations && gltfAnimations.length) {
                this._mixer = new THREE.AnimationMixer(object);

                for (let i = 0; i < gltfAnimations.length; i++) {
                    const animation = gltfAnimations[i];
                    const clipAction = this._mixer.clipAction(animation);

                    const anim = {
                        index: i,
                        name: gltfAnimations[i].name || i,
                        active: ko.observable(false),
                        clipAction: clipAction
                    };
                    this._subscribeToAnimUI(anim);
                    koAnimations.push(anim);
                }

                mainViewModel.animations(koAnimations);
                mainViewModel.anyAnimChanged();
            }

            scene.add(object);
            this._onWindowResize();

            mainViewModel.onReady();
        }, function(error) {
            console.error(error);
            mainViewModel.showErrorMessage(error.stack);
        });
    }

    _onWindowResize() {
        if (!this._enabled) {
            return;
        }

        this._camera.aspect = this._container.offsetWidth / this._container.offsetHeight;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(window.innerWidth, window.innerHeight);
    }

    _animate() {
        if (!this._enabled) {
            return;
        }

        requestAnimationFrame(() => this._animate());

        if (this._mixer) {
            this._mixer.update(this._clock.getDelta());
        }

        this._orbitControls.update();
        this._renderer.render(this._scene, this._camera);
    }

    /**
     * @function cleanup
     * Perform any cleanup that needs to happen to stop rendering the current model.
     * This is called right before the active engine for the preview window is switched.
     */
    cleanup() {
        if (this._backgroundSubscription) {
            this._backgroundSubscription.dispose();
            this._backgroundSubscription = undefined;
        }
        this._enabled = false;

        if (this._container && this._renderer) {
            this._container.removeChild(this._renderer.domElement);
        }

        this._camera = null;

        mainViewModel.animations([]);
        if (this._mixer) {
            this._mixer.stopAllAction();
        }

        window.removeEventListener('resize', this._resizeHandler, false);
    }

    startPreview() {
        const rev = document.getElementById('threeRevision');
        rev.textContent = 'r' + THREE.REVISION;

        const rootPath = document.getElementById('gltfRootPath').textContent;
        const gltfContent = document.getElementById('gltf').textContent;

        this._resizeHandler = () => this._onWindowResize();
        this._enabled = true;
        this._initScene(rootPath, gltfContent);
        this._animate();
        window.addEventListener('resize', this._resizeHandler, false);
    }
}
