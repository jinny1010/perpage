import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useToast } from '../components/Toast';

export default function Home() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const containerRef = useRef(null);

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

  const defaultImage = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400';

  return (
    <>
      <Head>
        <title>JSON Viewer</title>
      </Head>

      <div className="vertical-carousel-container" ref={containerRef}>
        {/* 좌측 타이틀 */}
        <div className="vertical-carousel-title">
          <span>ordinary day</span>
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

        {/* 세로 스크롤 카드들 */}
        {!loading && folders.length > 0 && (
          <div className="vertical-carousel-track">
            {folders.map((folder, index) => (
              <Link href={`/folder/${encodeURIComponent(folder.name)}`} key={folder.name}>
                <div className="vertical-card">
                  <div 
                    className="vertical-card-image"
                    style={{
                      backgroundImage: folder.imageUrl 
                        ? `url(${folder.imageUrl})` 
                        : `url(${defaultImage})`
                    }}
                  />
                  
                  {/* 우측 정보 */}
                  <div className="vertical-card-info">
                    <div className="vertical-card-number">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="vertical-card-meta">
                      <span className="vertical-card-by">by</span>
                      <span className="vertical-card-name">{folder.name}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
