import styles from '../styles/Home.module.css';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import TreeJs from '../component/treeJs';

export default function Home(props) {
  const [gltfUrl, setGltfUrl] = useState(props.gltfList[0].url);
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
    <div className={styles.container}>
      <Head>
        <title>LG POC</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <div>
        <label htmlFor={'gltfList'}>gltf 리스트 : </label>
        <select id={'gltfList'} value={gltfUrl} onChange={handleGltfUrlChange}>
          {props.gltfList.map((gltf, i) => (
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

      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        footer img {
          margin-left: 0.5rem;
        }

        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }

        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono,
            Bitstream Vera Sans Mono, Courier New, monospace;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu,
            Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}

export async function getStaticProps() {
  return {
    props: {
      gltfList: [
        { url: '/assets/unreal/BP_Titan_Interior.gltf', name: '언리얼 내보내기 디폴트 옵션' },
        { url: '/assets/untitled.glb', name: 'glb' },
      ],
    },
  };
}
