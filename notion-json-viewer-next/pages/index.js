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
  
  // 폴더 추가/수정 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#8B0000');
  const [newFolderImage, setNewFolderImage] = useState(null);
  const [adding, setAdding] = useState(false);
  const folderImageRef = useRef(null);
  
  // 컨텍스트 메뉴
  const [contextMenu, setContextMenu] = useState(null);
  
  // 삭제 확인 모달
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
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

  const handleContextMenu = (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 150),
      y: Math.min(e.clientY, window.innerHeight - 100),
      folder,
    });
  };

  const openAddModal = () => {
    setEditMode(false);
    setEditingFolder(null);
    setNewFolderName('');
    setNewFolderColor('#8B0000');
    setNewFolderImage(null);
    setShowAddModal(true);
  };

  const openEditModal = (folder) => {
    setEditMode(true);
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderColor(folder.color || '#8B0000');
    setNewFolderImage(null);
    setShowAddModal(true);
    setContextMenu(null);
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) {
      showToast('폴더 이름을 입력해주세요', 'error');
      return;
    }
    
    setAdding(true);
    try {
      const formData = new FormData();
      formData.append('name', newFolderName);
      formData.append('color', newFolderColor);
      if (newFolderImage) {
        formData.append('image', newFolderImage);
      }
      
      if (editMode && editingFolder) {
        formData.append('pageId', editingFolder.id);
        formData.append('oldName', editingFolder.name);
      }
      
      const res = await fetch(editMode ? '/api/updateFolder' : '/api/addFolder', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      showToast(editMode ? '수정 완료!' : '폴더 추가 완료!', 'success');
      setShowAddModal(false);
      setNewFolderName('');
      setNewFolderImage(null);
      setEditingFolder(null);
      fetchFolders();
    } catch (err) {
      showToast((editMode ? '수정' : '추가') + ' 실패: ' + err.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/deleteFolder?pageId=${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('삭제 완료!', 'success');
      setDeleteTarget(null);
      fetchFolders();
    } catch (err) {
      showToast('삭제 실패: ' + err.message, 'error');
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
                <div 
                  className="main-card-row"
                  onContextMenu={(e) => handleContextMenu(e, folder)}
                >
                  <div 
                    className="main-card-image no-filter"
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
                    <div className="main-card-accent" style={{ backgroundColor: folder.color || '#8B0000' }} />
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

        <button className="add-folder-btn" onClick={openAddModal}>+</button>
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => openEditModal(contextMenu.folder)}>✏️ 수정</button>
          <button onClick={() => { setDeleteTarget(contextMenu.folder); setContextMenu(null); }}>🗑️ 삭제</button>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>🗑️ 폴더 삭제</h3>
            <p>"{deleteTarget.name}" 폴더를 삭제할까요?</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>취소</button>
              <button className="btn-submit btn-danger" onClick={handleDeleteFolder}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 폴더 추가/수정 모달 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editMode ? '✏️ 폴더 수정' : '📁 새 폴더 추가'}</h3>
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
              <label>대표 이미지 {editMode && '(변경시에만 선택)'}</label>
              <div className="file-drop" onClick={() => folderImageRef.current?.click()}>
                {newFolderImage ? `📷 ${newFolderImage.name}` : '클릭하여 이미지 선택'}
                <input 
                  ref={folderImageRef}
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setNewFolderImage(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </div>
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
                {adding ? '처리 중...' : (editMode ? '수정' : '추가')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
