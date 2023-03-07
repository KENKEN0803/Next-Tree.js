import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useEffect, useRef } from 'react';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

export default function _ThreeJS({ gltfUrl }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (canvasRef.current) {
      const scene = new THREE.Scene();
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        // antialias: true,
      });
      // renderer.outputEncoding = THREE.sRGBEncoding;
      // const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
      const camera = new THREE.PerspectiveCamera(50, 1);

      camera.position.set(0, 0, 1);

      const loader = new GLTFLoader();

      scene.background = new THREE.Color('white');
      const light = new THREE.DirectionalLight('white', 3);
      scene.add(light);

      loader.load(
        gltfUrl,
        (object) => {
          console.log('loaded', object);
          scene.add(object.scene);
          // renderer.render(scene, camera);
          const animate = () => {
            requestAnimationFrame(animate);
            object.scene.rotation.x += 0.01;
            object.scene.rotation.y += 0.01;
            const controls = new OrbitControls(camera, renderer.domElement);

            controls.enableDamping = true;
            controls.dampingFactor = 0.05; // friction
            controls.rotateSpeed = 0.05; // mouse sensitivity
            controls.update();
            renderer.render(scene, camera);
          };
          animate();
        },
        (progress) => {
          console.info(progress);
        },
        (error) => {
          console.error(error);
        },
      );
    }
  }, [canvasRef, gltfUrl]);

  return <canvas ref={canvasRef} id='canvas' width='600' height='600'></canvas>;
}
