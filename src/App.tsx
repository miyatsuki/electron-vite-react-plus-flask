import { CircularProgress } from '@mui/material';
import { ipcRenderer } from 'electron';
import { useEffect, useState } from 'react';

console.log('[App.tsx]', `Hello world from Electron ${process.versions.electron}!`)

function App() {
  const [serverStatus, setServerStatus] = useState<{ status: string, url?: string }>({ status: "サーバ準備開始中" })
  const [serverURL, setServerURL] = useState<string | null>(null)

  useEffect(() => {
    // メインプロセスからのレスポンスを受け取る
    ipcRenderer.on('response-server-status', (event, args: { status: string, url?: string }) => {
      console.log('[App.tsx]', 'response-server-status', args)
      setServerStatus(args)
      if (args.url) {
        setServerURL(args.url)
      }
    });
  }, []);

  const fetchButton = serverURL ? (
    <button onClick={() => {
      fetch(`${serverURL}/healthcheck`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          console.log(data)
          // データの処理
        })
        .catch(error => {
          // エラーハンドリング
          console.log('Error:', error);
        });
    }}
    >fetch</button>
  ) : (
    <div>
      {serverStatus.status}... <CircularProgress />
    </div>
  )

  return (
    <div className='App'>
      <h1>Electron + Vite + React</h1>
      {fetchButton}
    </div>
  )
}

export default App
