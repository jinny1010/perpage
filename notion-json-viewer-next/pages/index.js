import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useToast } from '../components/Toast';

export default function Home() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { showToast } = useToast();
  const carouselRef = useRef(null);

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

  // 휠 스크롤로 카드 이동
  const handleWheel = (e) => {
    e.preventDefault();
    if (folders.length === 0) return;
    
    if (e.deltaY > 0) {
      setCurrentIndex(prev => (prev + 1) % folders.length);
    } else {
      setCurrentIndex(prev => (prev - 1 + folders.length) % folders.length);
    }
  };

  // 터치 스와이프
  const touchStartX = useRef(0);
  
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrentIndex(prev => (prev + 1) % folders.length);
      } else {
        setCurrentIndex(prev => (prev - 1 + folders.length) % folders.length);
      }
    }
  };

  const getCardStyle = (index) => {
    const diff = index - currentIndex;
    const normalizedDiff = ((diff + folders.length) % folders.length);
    const actualDiff = normalizedDiff > folders.length / 2 ? normalizedDiff - folders.length : normalizedDiff;
    
    const translateX = actualDiff * 280;
    const scale = Math.max(0.6, 1 - Math.abs(actualDiff) * 0.15);
    const opacity = Math.max(0.3, 1 - Math.abs(actualDiff) * 0.3);
    const zIndex = 100 - Math.abs(actualDiff);
    const rotateY = actualDiff * -15;

    return {
      transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
      opacity,
      zIndex,
    };
  };

  // 기본 이미지 (폴더에 이미지 없을 때)
  const defaultImage = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400';

  return (
    <>
      <Head>
        <title>JSON Viewer</title>
      </Head>

      <div className="carousel-container">
        {/* 배경 블러 이미지 */}
        <div 
          className="carousel-bg"
          style={{
            backgroundImage: folders[currentIndex]?.imageUrl 
              ? `url(${folders[currentIndex].imageUrl})` 
              : `url(${defaultImage})`
          }}
        />

        {/* 헤더 */}
        <div className="carousel-header">
          <h1>ordinary day</h1>
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

        {/* 캐러셀 */}
        {!loading && folders.length > 0 && (
          <div 
            className="carousel-wrapper"
            ref={carouselRef}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="carousel-track">
              {folders.map((folder, index) => (
                <Link href={`/folder/${encodeURIComponent(folder.name)}`} key={folder.name}>
                  <div 
                    className={`carousel-card ${index === currentIndex ? 'active' : ''}`}
                    style={getCardStyle(index)}
                    onClick={(e) => {
                      if (index !== currentIndex) {
                        e.preventDefault();
                        setCurrentIndex(index);
                      }
                    }}
                  >
                    <div 
                      className="carousel-card-image"
                      style={{
                        backgroundImage: folder.imageUrl 
                          ? `url(${folder.imageUrl})` 
                          : `url(${defaultImage})`
                      }}
                    />
                    <div className="carousel-card-overlay">
                      <div className="carousel-card-number">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="carousel-card-info">
                        <h3>{folder.name}</h3>
                        <p>{folder.count}개의 기록</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* 인디케이터 */}
            <div className="carousel-indicators">
              {folders.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
