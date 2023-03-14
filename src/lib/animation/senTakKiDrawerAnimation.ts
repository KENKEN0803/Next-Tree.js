import { animationType, CustomAnimation, XYZ } from '@/lib/animation/CustomAnimation';
import TreeJs from '@/component/treeJs';

interface ConstructorParams {
  toXYZ: XYZ;
  animationType: animationType;
  duration: number;
}

export class SenTakKiDrawerAnimation implements CustomAnimation {
  constructor({ toXYZ, animationType, duration }: ConstructorParams) {
    this.toPosition = toXYZ;
    this.animationType = animationType;
    this.duration = duration;
  }

  treeJsThis: TreeJs;
  clickedObject: any;
  originalPosition: XYZ;
  toPosition: XYZ;
  duration: number;
  animationType: animationType;

  // override
  onComplete(): void {}

  // override
  onStart(): void {}

  // override
  onUpdate(): void {}

  setTreeJsThis(treeJsThis: TreeJs): CustomAnimation {
    this.treeJsThis = treeJsThis;
    return this;
  }

  setClickedObject(clickedObject: any): CustomAnimation {
    this.clickedObject = clickedObject;
    return this;
  }

  setOriginalPosition(originalPosition: XYZ): CustomAnimation {
    this.originalPosition = originalPosition;
    return this;
  }
}
