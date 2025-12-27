import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useToast } from '../components/Toast';

export default function Home() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const containerRef = useRef(null);
  const originalLength = useRef(0);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/folders');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to fetch');
      
      const original = data.folders || [];
      originalLength.current = original.length;
      
      if (original.length > 0) {
        // 무한 루프용: 앞뒤로 복제
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

  // 무한 스크롤 처리
  const handleScroll = useCallback(() => {
    if (!containerRef.current || originalLength.current === 0) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const oneSetHeight = scrollHeight / 3;
    
    // 맨 위 도달 시 중간으로 점프
    if (scrollTop < oneSetHeight * 0.3) {
      container.scrollTop = scrollTop + oneSetHeight;
    }
    // 맨 아래 도달 시 중간으로 점프
    else if (scrollTop > oneSetHeight * 2.3) {
      container.scrollTop = scrollTop - oneSetHeight;
    }
  }, []);

  // 초기 스크롤 위치 중간으로
  useEffect(() => {
    if (containerRef.current && folders.length > 0) {
      const scrollHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTop = scrollHeight / 3;
    }
  }, [folders]);

  const defaultImage = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400';

  return (
    <>
      <Head>
        <title>JSON Viewer</title>
      </Head>

      <div 
        className="main-scroll-container"
        ref={containerRef}
        onScroll={handleScroll}
      >
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
                      {String((index % originalLength.current) + 1).padStart(2, '0')}
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
