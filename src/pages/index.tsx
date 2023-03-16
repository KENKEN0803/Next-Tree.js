import styles from './page.module.css';
import TreeJs from '@/component/treeJs';
import { useEffect, useState } from 'react';

const gltfList = [
  { url: '/assets/full/BP_Titan_Interior.gltf', name: '풀버전' },
  { url: '/assets/compress.glb', name: '블랜더 압축후 내보내기' },
];
export default function Home() {
  const [gltfUrl, setGltfUrl] = useState(gltfList[0].url);
  const [enable, setEnable] = useState(true);
  const [width, setWidth] = useState(undefined);
  const [height, setHeight] = useState(undefined);
  const [tempWidth, setTempWidth] = useState(undefined);
  const [tempHeight, setTempHeight] = useState(undefined);

  useEffect(() => {
    if (!enable) {
      setEnable(true);
    }
  }, [enable]);

  const handleGltfUrlChange = (e) => {
    setGltfUrl(e.target.value);
    setEnable(false);
  };

  const handleSizeChange = () => {
    setWidth(tempWidth);
    setHeight(tempHeight);
    setEnable(false);
  };

  const handleReset = () => {
    setWidth(undefined);
    setHeight(undefined);
    setTempWidth(undefined);
    setTempHeight(undefined);
    setEnable(false);
  };
  return (
    <main className={styles.main}>
      <div>
        <label htmlFor={'gltfList'}>gltf 리스트 : </label>
        <select id={'gltfList'} value={gltfUrl} onChange={handleGltfUrlChange}>
          {gltfList.map((gltf, i) => (
            <option value={gltf.url} key={`gltf${i}`}>
              {gltf.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={'width'}>width : </label>
        <input
          id={'width'}
          type={'number'}
          value={width}
          onChange={(e) => setTempWidth(e.target.value)}
        />
        <label htmlFor={'height'}>height : </label>
        <input
          id={'height'}
          type={'number'}
          value={height}
          onChange={(e) => setTempHeight(e.target.value)}
        />
        <button onClick={handleSizeChange}>적용</button>
        <button onClick={handleReset}>리셋</button>
      </div>

      {enable && (
        <TreeJs
          gltfUrl={gltfUrl}
          width={width}
          height={height}
          enable={enable}
          setEnable={setEnable}
        />
      )}
    </main>
  );
}

// export async function getStaticProps() {
//   return {
//     props: {
//       gltfList: [
//         { url: "/assets/full/BP_Titan_Interior.gltf", name: "풀버전" },
//         { url: "/assets/compress.glb", name: "블랜더 압축후 내보내기" }
//       ]
//     }
//   };
// }
