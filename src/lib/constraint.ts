import { animationType, XYZ } from '@/lib/animation/CustomAnimation';

interface animationConfig {
  duration: number;
  animationType: animationType;
  toXYZ: XYZ;
  useParent: boolean;
}

export type ClickableObject = {
  name: string[];
  animationConfig: animationConfig;
};
export const clickableObjectList: ClickableObject[] = [
  {
    name: [
      'Titan_Drawer_0926_F220_Panel_Assembly_Drawer_3',
      'Titan_Drawer_0926_F220_Panel_Assembly_Drawer_1',
    ],
    animationConfig: {
      duration: 1000,
      animationType: 'position',
      toXYZ: { x: 0, y: 0.2, z: 0 },
      useParent: true,
    },
  },
];
