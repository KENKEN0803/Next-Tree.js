'use client';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import React, { Component, createRef } from 'react';
import { clickableObjectList } from '@/lib/constraint';
import _ from 'lodash';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';

interface TresJsComponentProps {
  gltfUrl: string;
  width?: number;
  height?: number;
  enable: boolean;
  setEnable: (enable: boolean) => void;
  children?: React.ReactNode;
}

export default class TreeJs extends Component<TresJsComponentProps> {
  constructor(props: TresJsComponentProps) {
    super(props);
    this._setEnable = props.setEnable;
    this._enable = props.enable;
    this._gltfUrl = props.gltfUrl;
    this._width = props.width;
    this._height = props.height;
    this._isFullScreen = !props.width || !props.height;
  }

  state = {
    progress: 0,
    loadedBytes: 0,
    totalBytes: 0,
    clickedObject: '',
  };

  _setEnable: (enable: boolean) => void;
  _enable: boolean;
  _gltfUrl: string;
  _width?: number;
  _height?: number;
  _isFullScreen: boolean;
  _canvasRef = createRef<HTMLCanvasElement>();
  _container = null;
  _camera = null;
  _clock = null;
  _scene = null;
  _renderer = null;
  _mixer = null;
  _orbitControls = null;
  _raycaster = new THREE.Raycaster();
  _mouse = new THREE.Vector2();
  _clickedObject = null;
  _isAnimationComplete = true;

  _resizeHandler = null;

  componentDidMount() {
    this.startPreview();
  }

  componentWillUnmount() {
    this.cleanup();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.gltfUrl !== this._gltfUrl) {
      console.log('prevProps.gltfUrl', prevProps.gltfUrl, 'this.props.gltfUrl', this._gltfUrl);
      this.cleanup();
      this.startPreview();
    }
  }

  startPreview() {
    this._resizeHandler = () => this._onWindowResize();
    this._initScene();
    this._animate();
    window.addEventListener('resize', this._resizeHandler, false);
    const canvas = this._canvasRef.current as HTMLCanvasElement;
    canvas.addEventListener('click', this.onMouseClick.bind(this), false);
    // TODO 주석해제, 퍼포먼스 이슈 해결
    // this._canvasRef.current.addEventListener('mousemove', this.onMouseMove.bind(this), false);
  }

  onMouseMove = _.throttle((event) => {
    const canvas = this._canvasRef.current as HTMLCanvasElement;
    this._mouse.x = (event.offsetX / canvas.clientWidth) * 2 - 1;
    this._mouse.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;
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
    const canvas = this._canvasRef.current as HTMLCanvasElement;
    this._mouse.x = (event.offsetX / canvas.clientWidth) * 2 - 1;
    this._mouse.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;
    this._raycaster.setFromCamera(this._mouse, this._camera);
    const intersects = this._raycaster.intersectObject(this._scene, true);
    if (intersects.length) {
      this._clickedObject = intersects[0].object;
      const clickedObjectName = intersects[0].object.name;

      if (this.state.clickedObject !== clickedObjectName) {
        this.setState({ clickedObject: clickedObjectName });
      }

      if (clickableObjectList.includes(clickedObjectName)) {
        alert(clickedObjectName);
      }

      if (this._isAnimationComplete) {
        this._playAnimation();
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
      this._clickedObject = null;
      if (this.state.clickedObject !== '') {
        this.setState({ clickedObject: '' });
      }
    }
  }

  _initScene() {
    this._clock = new THREE.Clock();

    this._container = this._canvasRef.current;

    const scene = (this._scene = new THREE.Scene());

    scene.add(new THREE.AxesHelper(5));

    const camera = (this._camera = new THREE.PerspectiveCamera(
      45,
      this._container.offsetWidth / this._container.offsetHeight,
      1e-5,
      1e10,
    ));

    scene.add(camera);

    // set background

    const backgroundTextureLoader = new THREE.TextureLoader();
    const backgroundTexture = backgroundTextureLoader.load('/assets/bg.jpeg', () => {
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
    if (this._isFullScreen) {
      renderer.setSize(window.innerWidth, window.innerHeight);
    } else {
      renderer.setSize(this._width, this._height);
    }
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
      this._gltfUrl,
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
        // 계층 형식으로 로그 찍기
        console.log(this._dumpObject(object).join('\n'));
        console.log('onLoad End');
      },
      (progress) => {
        // TODO backend content length set
        this._loadingProgress(progress);
      },
      (error) => {
        console.error(error);
      },
    );
  }

  _loadingProgress = _.throttle((progress) => {
    this.setState({
      progress: (progress.loaded / progress.total) * 100,
      loadedBytes: progress.loaded,
      totalBytes: progress.total,
    });
  }, 100);

  _animate() {
    if (!this._enable) return;

    if (this._mixer) {
      this._mixer.update(this._clock.getDelta());
    }
    if (this._orbitControls) {
      this._orbitControls.update();
    }
    if (this._scene && this._camera && this._renderer) {
      this._renderer.render(this._scene, this._camera);
    }

    requestAnimationFrame(() => this._animate());
  }

  _onWindowResize = _.debounce(() => {
    // 풀스크린 상태가 아니면 리턴
    if (!this._enable || !this._isFullScreen) return;

    console.log('onWindowResize', this._container.offsetWidth, this._container.offsetHeight);
    this._camera.aspect = this._container.offsetWidth / this._container.offsetHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }, 100);

  // 계층 형식으로 로그 찍기
  _dumpObject = (obj, lines = [], isLast = true, prefix = '') => {
    function dumpVec3(v3, precision = 3) {
      return `${v3.x.toFixed(precision)}, ${v3.y.toFixed(precision)}, ${v3.z.toFixed(precision)}`;
    }

    const localPrefix = isLast ? '└─' : '├─';
    lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
    const dataPrefix = obj.children.length ? (isLast ? '  │ ' : '│ │ ') : isLast ? '    ' : '│   ';
    lines.push(`${prefix}${dataPrefix}  pos: ${dumpVec3(obj.position)}`);
    lines.push(`${prefix}${dataPrefix}  rot: ${dumpVec3(obj.rotation)}`);
    lines.push(`${prefix}${dataPrefix}  scl: ${dumpVec3(obj.scale)}`);
    const newPrefix = prefix + (isLast ? '  ' : '│ ');
    const lastNdx = obj.children.length - 1;
    obj.children.forEach((child, ndx) => {
      const isLast = ndx === lastNdx;
      this._dumpObject(child, lines, isLast, newPrefix);
    });
    return lines;
  };

  /**
   * @function cleanup
   * Perform any cleanup that needs to happen to stop rendering the current model.
   * This is called right before the active engine for the preview window is switched.
   */
  cleanup() {
    console.log('cleanup');
    this._setEnable(false);
    this._enable = false;

    if (this._container && this._renderer) {
      // this._container.removeChild(this._renderer.domElement);
    }

    if (this._mixer) {
      this._mixer.stopAllAction();
    }

    window.removeEventListener('resize', this._resizeHandler, false);
    const canvas = this._canvasRef.current as HTMLCanvasElement;
    canvas.removeEventListener('click', this.onMouseClick.bind(this), false);
    canvas.removeEventListener('mousemove', this.onMouseMove.bind(this), false);

    this._container = null;
    this._camera = null;
    this._clock = null;
    this._scene = null;
    this._renderer = null;
    this._mixer = null;
    this._orbitControls = null;
    this._raycaster = null;
    this._mouse = null;
    this._canvasRef = null;
  }

  _playAnimation() {
    // rotate clicked object smoothly
    if (this._clickedObject.name) {
      if (this._isAnimationComplete) {
        this._isAnimationComplete = false;
      } else {
        return;
      }
      const x = this._clickedObject.rotation.x;
      const y = this._clickedObject.rotation.y;
      const z = this._clickedObject.rotation.z;
      console.log('playAnimation', this._isAnimationComplete, x, y, z);
      new TWEEN.Tween(this._clickedObject.rotation)
        .to({ x: Math.PI * 2, y: Math.PI * 2, z: Math.PI * 2 }, 2000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onStart(() => {})
        .onUpdate(() => {})
        .start()
        .onComplete(() => {
          TWEEN.removeAll();
          this._isAnimationComplete = true;
          // reset clicked object
          this._clickedObject.rotation.x = x;
          this._clickedObject.rotation.y = y;
          this._clickedObject.rotation.z = z;
        });

      const animate = () => {
        const funcId = requestAnimationFrame(animate);
        if (this._isAnimationComplete) {
          cancelAnimationFrame(funcId);
        } else {
          TWEEN.update();
        }
      };
      animate();
    }
  }

  render() {
    console.log('render', this._width, this._height);
    const width = this._width;
    const height = this._height;
    const { progress, clickedObject, loadedBytes, totalBytes } = this.state;
    const children = this.props.children;
    return (
      <>
        <button onClick={this._playAnimation.bind(this)}>playAnimation</button>
        <div>
          Loading progress : {loadedBytes}/{totalBytes} {progress}%
        </div>
        <div>Clicked object : {clickedObject}</div>
        {children}
        <canvas ref={this._canvasRef} id='threeContainer' width={width} height={height} />
      </>
    );
  }
}
