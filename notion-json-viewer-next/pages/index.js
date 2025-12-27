import { useState, useEffect, useRef } from 'react';
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
      
      // 무한 루프를 위해 앞뒤로 복제
      const original = data.folders || [];
      if (original.length > 0) {
        setFolders([...original, ...original, ...original]);
      } else {
        setFolders([]);
      }
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

      <div className="main-scroll-container">
        {/* 좌측 세로 타이틀 */}
        <div className="main-side-title">
          <span>ordinary day</span>
        </div>

        {loading && (
          <div className="loading" style={{ color: 'white' }}>
            <div className="spinner"></div>
            <p>불러오는 중...</p>
          </div>
        )}

        {!loading && folders.length === 0 && (
          <div className="empty-state" style={{ color: 'white' }}>
            <div className="icon">📁</div>
            <p>등록된 캐릭터가 없습니다</p>
          </div>
        )}

        {/* 카드 리스트 */}
        {!loading && folders.length > 0 && (
          <div className="main-cards-wrapper">
            {folders.map((folder, index) => (
              <Link href={`/folder/${encodeURIComponent(folder.name)}`} key={`${folder.name}-${index}`}>
                <div className="main-card-row">
                  {/* 이미지 */}
                  <div 
                    className="main-card-image"
                    style={{
                      backgroundImage: folder.imageUrl 
                        ? `url(${folder.imageUrl})` 
                        : `url(${defaultImage})`
                    }}
                  />
                  
                  {/* 우측 정보 */}
                  <div className="main-card-info">
                    <div className="main-card-number">
                      {String((index % Math.ceil(folders.length / 3)) + 1).padStart(2, '0')}
                    </div>
                    <div className="main-card-divider" />
                    <div className="main-card-meta">
                      <span className="main-card-by">by</span>
                      <span className="main-card-name">{folder.name}</span>
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
