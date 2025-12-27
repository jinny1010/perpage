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
  
  // 폴더 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#8B0000');
  const [adding, setAdding] = useState(false);

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

  // 무한 스크롤
  const handleScroll = useCallback(() => {
    if (!containerRef.current || originalLength.current === 0) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const oneSetHeight = scrollHeight / 3;
    
    if (scrollTop < oneSetHeight * 0.3) {
      container.scrollTop = scrollTop + oneSetHeight;
    } else if (scrollTop > oneSetHeight * 2.3) {
      container.scrollTop = scrollTop - oneSetHeight;
    }
  }, []);

  useEffect(() => {
    if (containerRef.current && folders.length > 0) {
      const scrollHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTop = scrollHeight / 3;
    }
  }, [folders]);

  // 폴더 추가
  const handleAddFolder = async () => {
    if (!newFolderName.trim()) {
      showToast('폴더 이름을 입력해주세요', 'error');
      return;
    }
    
    setAdding(true);
    try {
      const res = await fetch('/api/addFolder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          color: newFolderColor,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      showToast('폴더 추가 완료!', 'success');
      setShowAddModal(false);
      setNewFolderName('');
      fetchFolders();
    } catch (err) {
      showToast('추가 실패: ' + err.message, 'error');
    } finally {
      setAdding(false);
    }
  };

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

        {!loading && folders.length > 0 && (
          <div className="main-cards-wrapper">
            {folders.map((folder, index) => (
              <Link href={`/folder/${encodeURIComponent(folder.name)}`} key={`${folder.name}-${index}`}>
                <div className="main-card-row">
                  <div 
                    className="main-card-image"
                    style={{
                      backgroundImage: folder.imageUrl 
                        ? `url(${folder.imageUrl})` 
                        : `url(${defaultImage})`
                    }}
                  />
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

        {/* 폴더 추가 버튼 */}
        <button className="add-folder-btn" onClick={() => setShowAddModal(true)}>+</button>
      </div>

      {/* 폴더 추가 모달 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>📁 새 폴더 추가</h3>
            <div className="form-group">
              <label>폴더 이름</label>
              <input 
                type="text" 
                value={newFolderName} 
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="캐릭터 이름"
              />
            </div>
            <div className="form-group">
              <label>테마 색상</label>
              <input 
                type="color" 
                value={newFolderColor} 
                onChange={(e) => setNewFolderColor(e.target.value)}
                style={{ width: '100%', height: '40px', cursor: 'pointer' }}
              />
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>취소</button>
              <button className="btn-submit" onClick={handleAddFolder} disabled={adding}>
                {adding ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
