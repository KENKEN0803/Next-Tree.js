import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {useEffect, useRef} from "react";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ThreeJS = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        if (canvasRef.current) {
            const scene = new THREE.Scene();
            const renderer = new THREE.WebGLRenderer({
                canvas: canvasRef.current,
                antialias: true,
            });
            renderer.outputEncoding = THREE.sRGBEncoding;
            const camera = new THREE.PerspectiveCamera(50, 1);
            camera.position.set(0, 0, 5);
            const loader = new GLTFLoader();
            scene.background = new THREE.Color("white");
            const light = new THREE.DirectionalLight(0xffff00, 3);
            scene.add(light);

            const onLoadCallBack = (object) => {
                scene.add(object.scene);
                // renderer.render(scene, camera);
                const animate = () => {
                    requestAnimationFrame(animate);
                    object.scene.rotation.y += 0.01;
                    const controls = new OrbitControls( camera, renderer.domElement );
                    controls.enableDamping = true;
                    controls.dampingFactor = 0.1; // friction
                    controls.rotateSpeed = 0.1; // mouse sensitivity
                    controls.update();

                    renderer.render(scene, camera);
                }
                animate();
            }

            loader.load("/assets/scene.gltf", onLoadCallBack);
        }
    }, [canvasRef]);


    return <canvas ref={canvasRef} id="canvas" width="600" height="600"></canvas>;
};

export default ThreeJS;
