import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Component, createRef } from 'react';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

export default class TreeJs extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    progress: 0,
  };
  canvasRef = createRef();
  _enabled = false;
  _container = null;
  _camera = null;
  _clock = null;
  _scene = null;
  _renderer = null;
  _mixer = null;
  _orbitControls = null;
  _backgroundSubscription = undefined;

  componentDidMount() {
    this.startPreview();
  }

  componentWillUnmount() {
    this.cleanup();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.gltfUrl !== this.props.gltfUrl) {
      console.log('prevProps.gltfUrl', prevProps.gltfUrl, 'this.props.gltfUrl', this.props.gltfUrl);
      this.cleanup();
      this.startPreview();
    }
  }

  startPreview() {
    this._resizeHandler = () => this._onWindowResize();
    this._enabled = true;
    this._initScene();
    this._animate();
    window.addEventListener('resize', this._resizeHandler, false);
  }

  _initScene() {
    this._clock = new THREE.Clock();

    this._container = this.canvasRef.current;

    const scene = (this._scene = new THREE.Scene());

    // Note: The near and far planes can be set this way due to the use of "logarithmicDepthBuffer" in the renderer below.
    const camera = (this._camera = new THREE.PerspectiveCamera(
      45,
      this._container.offsetWidth / this._container.offsetHeight,
      1e-5,
      1e10,
    ));

    scene.add(camera);

    // RENDERER
    const renderer = (this._renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
      alpha: true,
      canvas: this._container,
    }));
    renderer.setClearColor(0x222222);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;

    const loader = new GLTFLoader();

    const cameraPos = new THREE.Vector3(-0.2, 0.4, 1.4);
    const orbitControls = (this._orbitControls = new OrbitControls(
      this._camera,
      renderer.domElement,
    ));

    const lightX = new THREE.DirectionalLight(0xffffff, 10);
    lightX.position.set(10, 0, 0);
    scene.add(lightX);

    const lightY = new THREE.DirectionalLight(0xffffff, 10);
    lightY.position.set(0, 10, 0);
    scene.add(lightY);

    const lightZ = new THREE.DirectionalLight(0xffffff, 10);
    lightZ.position.set(0, 0, 10);
    scene.add(lightZ);

    console.log(' this.props.gltfUrl', this.props.gltfUrl);
    loader.load(
      this.props.gltfUrl,
      (gltf) => {
        console.log('onLoad start', gltf);
        const object = gltf.scene;

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
        camera.zoom = modelSize * 1.5;
        camera.updateProjectionMatrix();
        camera.lookAt(modelCenter);

        // Add the model to the scene.
        scene.add(object);

        this._onWindowResize();

        console.log('onLoad End');
      },
      (progress) => {
        console.info(progress);
        // TODO backend content length set
        this.setState({ progress: progress.loaded / progress.total });
      },
      (error) => {
        console.error(error);
      },
    );
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    if (this._mixer) {
      this._mixer.update(this._clock.getDelta());
    }
    if (this._orbitControls) {
      this._orbitControls.update();
    }
    if (this._scene && this._camera && this._renderer) {
      this._renderer.render(this._scene, this._camera);
    }
  }

  _onWindowResize() {
    console.log('onWindowResize', this._container.offsetWidth, this._container.offsetHeight);
    this._camera.aspect = this._container.offsetWidth / this._container.offsetHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * @function cleanup
   * Perform any cleanup that needs to happen to stop rendering the current model.
   * This is called right before the active engine for the preview window is switched.
   */
  cleanup() {
    console.log('cleanup', this._backgroundSubscription);
    if (this._backgroundSubscription) {
      this._backgroundSubscription.dispose();
      this._backgroundSubscription = undefined;
    }

    this._enabled = false;

    if (this._container && this._renderer) {
      // this._container.removeChild(this._renderer.domElement);
    }

    this._camera = null;

    if (this._mixer) {
      this._mixer.stopAllAction();
    }

    window.removeEventListener('resize', this._resizeHandler, false);
  }

  render() {
    console.log('render', this.props.width, this.props.height);
    const width = this.props.width;
    const height = this.props.height;
    const progress = this.state.progress;
    return (
      <>
        <div>{progress}%</div>
        <canvas ref={this.canvasRef} id='threeContainer' width={width} height={height} />
      </>
    );
  }
}
