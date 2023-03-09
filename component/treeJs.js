import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Component, createRef } from 'react';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { clickableObjectList } from '../lib/constraint';
import _ from 'lodash';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader';

export default class TreeJs extends Component {
  constructor(props) {
    super(props);
    this._setEnable = props.setEnable;
    this._enable = props.enable;
  }

  state = {
    progress: 0,
    clickedObject: '',
  };
  _canvasRef = createRef();
  _container = null;
  _camera = null;
  _clock = null;
  _scene = null;
  _renderer = null;
  _mixer = null;
  _orbitControls = null;
  _raycaster = new THREE.Raycaster();
  _mouse = new THREE.Vector2();

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
    this._initScene();
    this._animate();
    window.addEventListener('resize', this._resizeHandler, false);
    this._canvasRef.current.addEventListener('click', this.onMouseClick.bind(this), false);
    // TODO 주석해제, 퍼포먼스 이슈 해결
    // this._canvasRef.current.addEventListener('mousemove', this.onMouseMove.bind(this), false);
  }

  onMouseMove = _.throttle((event) => {
    this._mouse.x = (event.offsetX / this._canvasRef.current.clientWidth) * 2 - 1;
    this._mouse.y = -(event.offsetY / this._canvasRef.current.clientHeight) * 2 + 1;
    this._raycaster.setFromCamera(this._mouse, this._camera);
    const intersects = this._raycaster.intersectObject(this._scene, true);
    // apply cursor pointer if intersection is detected
    if (intersects.length) {
      if (clickableObjectList.includes(intersects[0].object.name)) {
        if (this._renderer.domElement.style.cursor !== 'pointer') {
          this._renderer.domElement.style.cursor = 'pointer';
        }
      }
    } else {
      if (this._renderer.domElement.style.cursor !== 'auto') {
        this._renderer.domElement.style.cursor = 'auto';
      }
    }
  }, 300);

  onMouseClick(event) {
    // Full screen
    // this._mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    // this._mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this._mouse.x = (event.offsetX / this._canvasRef.current.clientWidth) * 2 - 1;
    this._mouse.y = -(event.offsetY / this._canvasRef.current.clientHeight) * 2 + 1;
    this._raycaster.setFromCamera(this._mouse, this._camera);
    const intersects = this._raycaster.intersectObject(this._scene, true);
    if (intersects.length) {
      const clickedObjectName = intersects[0].object.name;

      this.setState({ clickedObject: clickedObjectName });

      if (clickableObjectList.includes(clickedObjectName)) {
        alert(clickedObjectName);
      }
      // TODO set camera to clicked object
      // const clickedObject = this._scene.getObjectByName(clickedObjectName);
      // if (clickedObject.parent) {
      //   this._camera.lookAt(clickedObject.parent.position);
      //   this._camera.position.set(
      //     clickedObject.parent.position.x,
      //     clickedObject.parent.position.y,
      //     clickedObject.parent.position.z + 10,
      //   );
      // } else {
      //   this._camera.lookAt(clickedObject.position);
      //   this._camera.position.set(
      //     clickedObject.position.x,
      //     clickedObject.position.y,
      //     clickedObject.position.z + 10,
      //   );
      // }
    } else {
      this.setState({ clickedObject: '' });
    }
  }

  _initScene() {
    this._clock = new THREE.Clock();

    this._container = this._canvasRef.current;

    const scene = (this._scene = new THREE.Scene());

    const camera = (this._camera = new THREE.PerspectiveCamera(
      45,
      this._container.offsetWidth / this._container.offsetHeight,
      1e-5,
      1e10,
    ));

    scene.add(camera);

    // set background

    const backgroundTextureLoader = new THREE.TextureLoader();
    const backgroundTexture = backgroundTextureLoader.load(
      '/assets/bg.jpeg',
      () => {
        const rt = new THREE.WebGLCubeRenderTarget(backgroundTexture.image.height);
        rt.fromEquirectangularTexture(renderer, backgroundTexture);
        scene.background = rt.texture;
      });

    // 3D Background 6장짜리 이미지
    // scene.background = new THREE.CubeTextureLoader()
    //   // .setPath( 'textures/cubeMaps/' ) // prefix for all urls
    //   .load([
    //     'https://threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/pos-x.jpg',
    //     'https://threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/neg-x.jpg',
    //     'https://threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/pos-y.jpg',
    //     'https://threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/neg-y.jpg',
    //     'https://threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/pos-z.jpg',
    //     'https://threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/neg-z.jpg',
    //   ]);

    // 2D Background 그대로 보여주기
    // const backGroundTextureLoader = new THREE.TextureLoader();
    // backGroundTextureLoader.load(
    //   'https://3.bp.blogspot.com/-nKsvHDKHNvY/Usrb398L_CI/AAAAAAAALIU/ssDn6p7sRQc/s1600/bergsjostolen.jpg',
    //   function (texture) {
    //     scene.background = texture;
    //   },
    // );

    // set renderer
    const renderer = (this._renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
      alpha: true,
      canvas: this._container,
    }));
    renderer.setClearColor(0x222222);
    // full screen
    renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(this.props.width, this.props.height);
    renderer.outputEncoding = THREE.sRGBEncoding;

    const cameraPos = new THREE.Vector3(-0.2, 0.4, 1.4);
    const orbitControls = (this._orbitControls = new OrbitControls(
      this._camera,
      renderer.domElement,
    ));

    // set light

    const white = 0xffffff;

    const lightX = new THREE.DirectionalLight(white, 1);
    lightX.position.set(10, 0, 0);
    scene.add(lightX);

    const revLightX = new THREE.DirectionalLight(white, 1);
    revLightX.position.set(-10, 0, 0);
    scene.add(revLightX);

    const lightY = new THREE.DirectionalLight(white, 1);
    lightY.position.set(0, 10, 0);
    scene.add(lightY);

    const revLightY = new THREE.DirectionalLight(white, 1);
    revLightY.position.set(0, -10, 0);
    scene.add(revLightY);

    const lightZ = new THREE.DirectionalLight(white, 1);
    lightZ.position.set(0, 0, 10);
    scene.add(lightZ);

    const revLightZ = new THREE.DirectionalLight(white, 1);
    revLightZ.position.set(0, 0, -10);
    scene.add(revLightZ);

    const ambientLight = new THREE.AmbientLight(white, 1);
    scene.add(ambientLight);

    // 3D 압축 모델을 사용할 수 있다.
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load(
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

        // Set up _mouse orbit controls.
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
        camera.near = modelSize / 10;
        camera.far = modelSize * 10;
        // camera.zoom = modelSize * 1.5;
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

  _onWindowResize = _.debounce(() => {
    console.log('onWindowResize', this._container.offsetWidth, this._container.offsetHeight);
    return;
    // TODO 반응형으로 변경
    this._camera.aspect = this._container.offsetWidth / this._container.offsetHeight;
    this._camera.updateProjectionMatrix();
    // full screen
    // this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.setSize(this.props.width, this.props.height);
  }, 100);

  /**
   * @function cleanup
   * Perform any cleanup that needs to happen to stop rendering the current model.
   * This is called right before the active engine for the preview window is switched.
   */
  cleanup() {
    console.log('cleanup');
    this._setEnable(false);

    if (this._container && this._renderer) {
      // this._container.removeChild(this._renderer.domElement);
    }

    this._camera = null;

    if (this._mixer) {
      this._mixer.stopAllAction();
    }

    window.removeEventListener('resize', this._resizeHandler, false);
    this._canvasRef.current.removeEventListener('click', this.onMouseClick.bind(this), false);
    this._canvasRef.current.removeEventListener('mousemove', this.onMouseMove.bind(this), false);
  }

  render() {
    console.log('render', this.props.width, this.props.height);
    const width = this.props.width;
    const height = this.props.height;
    const { progress, clickedObject } = this.state;
    return (
      <>
        <div>Loading progress : {progress}%</div>
        <div>Clicked object : {clickedObject}</div>
        <canvas ref={this._canvasRef} id='threeContainer' width={width} height={height} />
      </>
    );
  }
}
