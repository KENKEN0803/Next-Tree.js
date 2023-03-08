import styles from '../styles/Home.module.css';
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import TreeJs from '../component/treeJs';
export default function Home(props) {
  const [gltfUrl, setGltfUrl] = useState(props.gltfList[0].url);
  const [enable, setEnable] = useState(true);

  useEffect(() => {
    setEnable(true);
  }, [enable]);

  const handleGltfUrlChange = (e) => {
    setGltfUrl(e.target.value);
    setEnable(false);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <div>
        <label htmlFor={'gltfList'}>gltfList : </label>
        <select id={'gltfList'} value={gltfUrl} onChange={handleGltfUrlChange}>
          {props.gltfList.map((gltf, i) => (
            <option value={gltf.url} key={`gltf${i}`}>
              {gltf.name}
            </option>
          ))}
        </select>
      </div>

      {enable && (
        <TreeJs
          gltfUrl={gltfUrl}
          width={600}
          height={600}
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
        { url: '/assets/only_selected/only_selected.gltf', name: '선택된것만' },
        { url: '/assets/full/POC_Titan_Interior.gltf', name: 'FULL' },
        { url: '/assets/gik_gae/gik_gae.gltf', name: '직계자손' },
      ],
    },
  };
}
