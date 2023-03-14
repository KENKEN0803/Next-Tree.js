import TreeJs from '@/component/treeJs';

export type XYZ = {
  x: number;
  y: number;
  z: number;
};
export type animationType = 'position' | 'rotation' | 'scale';

export interface CustomAnimation {
  animationType: animationType;
  treeJsThis: TreeJs;
  clickedObject: any;
  originalPosition: XYZ;
  toPosition: XYZ;

  duration: number;
  onStart: () => void;
  onUpdate: () => void;
  onComplete: () => void;

  setTreeJsThis(treeJsThis: TreeJs): void;

  setClickedObject(clickedObject: any): void;

  setOriginalPosition(originalPosition: XYZ): void;
}
