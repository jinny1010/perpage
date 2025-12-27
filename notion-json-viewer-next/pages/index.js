import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useToast } from '../components/Toast';

export default function Home() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/folders');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to fetch');
      
      setFolders(data.folders || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>JSON Viewer</title>
      </Head>

      <div className="main-container">
        <div className="main-header">
          <h1>📚 JSON Viewer</h1>
          <p>캐릭터를 선택하세요</p>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>불러오는 중...</p>
          </div>
        )}

        {!loading && folders.length === 0 && (
          <div className="empty-state">
            <div className="icon">📁</div>
            <p>등록된 캐릭터가 없습니다</p>
          </div>
        )}

        <div className="folder-grid">
          {folders.map(folder => (
            <Link href={`/folder/${encodeURIComponent(folder.name)}`} key={folder.name}>
              <div className="folder-card">
                <div className="folder-icon">📁</div>
                <div className="folder-name">{folder.name}</div>
                <div className="folder-count">{folder.count}개</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
