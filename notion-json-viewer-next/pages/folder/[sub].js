import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useToast } from '../../components/Toast';
import ImageViewer from '../../components/ImageViewer';

export default function FolderPage() {
  const router = useRouter();
  const { sub } = router.query;
  const { showToast } = useToast();
  
  // 폴더 정보
  const [folderInfo, setFolderInfo] = useState(null);
  const [folderIndex, setFolderIndex] = useState(0);
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState('');
  
  // 게시글
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 뷰어 상태
  const [selectedPost, setSelectedPost] = useState(null);
  const [messages, setMessages] = useState([]);
  const [viewerLoading, setViewerLoading] = useState(false);
  
  // 테마
  const [theme, setTheme] = useState(1);
  
  // 등록 모달
  const [showModal, setShowModal] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // 삭제 대상
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // 책갈피
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState(null);
  
  // 책갈피 추가 모달
  const [bookmarkModal, setBookmarkModal] = useState(null);
  const [bookmarkImage, setBookmarkImage] = useState(null);
  const [bookmarkSaving, setBookmarkSaving] = useState(false);
  const bookmarkImageRef = useRef(null);
  
  // 컨텍스트 메뉴
  const [contextMenu, setContextMenu] = useState(null);
  
  // 시계
  const [time, setTime] = useState(new Date());
  
  // 스크롤
  const viewerRef = useRef(null);
  const longPressTimer = useRef(null);

  // 시계 업데이트
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 테마 불러오기/저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('jsonViewerTheme');
      if (savedTheme) setTheme(Number(savedTheme));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jsonViewerTheme', theme.toString());
    }
  }, [theme]);

  // 데이터 로드
  useEffect(() => {
    if (sub) {
      fetchFolderInfo();
      fetchPosts();
      fetchBookmarks();
    }
  }, [sub]);

  // 스크롤 위치 복원
  useEffect(() => {
    if (selectedPost && viewerRef.current && !viewerLoading) {
      const savedPosition = localStorage.getItem(`scroll_${selectedPost.id}`);
      if (savedPosition) {
        setTimeout(() => {
          if (viewerRef.current) {
            viewerRef.current.scrollTop = Number(savedPosition);
          }
        }, 100);
      }
    }
  }, [selectedPost, viewerLoading]);

  const handleScroll = () => {
    if (selectedPost && viewerRef.current) {
      localStorage.setItem(`scroll_${selectedPost.id}`, viewerRef.current.scrollTop.toString());
    }
  };

  // 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const fetchFolderInfo = async () => {
    try {
      const res = await fetch('/api/folders');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      const folders = data.folders || [];
      const index = folders.findIndex(f => f.name === sub);
      const folder = folders[index];
      
      setFolderInfo(folder);
      setFolderIndex(index + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?sub=${encodeURIComponent(sub)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPosts(data.posts || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    setBookmarksLoading(true);
    try {
      const res = await fetch(`/api/bookmarks?sub=${encodeURIComponent(sub)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      console.error('Bookmarks error:', err);
    } finally {
      setBookmarksLoading(false);
    }
  };

  const openPost = async (post) => {
    setSelectedPost(post);
    setViewerLoading(true);
    setMessages([]);
    
    try {
      const res = await fetch(`/api/content?pageId=${post.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessages(data.messages || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setViewerLoading(false);
    }
  };

  const closeViewer = () => {
    setSelectedPost(null);
    setMessages([]);
  };

  const handleUpload = async () => {
    if (!uploadData.title) {
      showToast('제목을 입력해주세요', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('sub', sub);
      formData.append('title', uploadData.title);
      if (uploadFile) formData.append('file', uploadFile);

      const res = await fetch('/api/create', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast('등록 완료!', 'success');
      setShowModal(false);
      setUploadData({ title: '' });
      setUploadFile(null);
      fetchPosts();
    } catch (err) {
      showToast('등록 실패: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/delete?pageId=${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('삭제 완료!', 'success');
      setDeleteTarget(null);
      fetchPosts();
    } catch (err) {
      showToast('삭제 실패: ' + err.message, 'error');
    }
  };

  const handleDeleteMessage = async (index) => {
    try {
      const res = await fetch('/api/deleteMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: selectedPost.id, messageIndex: index }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const updated = [...messages];
      updated.splice(index, 1);
      setMessages(updated);
      setDeleteTarget(null);
      showToast('메시지 삭제됨', 'success');
    } catch (err) {
      showToast('삭제 실패: ' + err.message, 'error');
    }
  };

  const handleSaveBookmark = async () => {
    if (!bookmarkModal?.text) return;
    setBookmarkSaving(true);
    try {
      const formData = new FormData();
      formData.append('text', bookmarkModal.text);
      formData.append('sourceTitle', bookmarkModal.sourceTitle || '');
      formData.append('sub', sub);
      if (bookmarkImage) formData.append('image', bookmarkImage);

      const res = await fetch('/api/bookmark', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast('책갈피 저장!', 'success');
      setBookmarkModal(null);
      setBookmarkImage(null);
      fetchBookmarks();
    } catch (err) {
      showToast('저장 실패: ' + err.message, 'error');
    } finally {
      setBookmarkSaving(false);
    }
  };

  const handleContextMenu = (e, type, data) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: Math.min(e.clientX || 100, window.innerWidth - 150),
      y: Math.min(e.clientY || 100, window.innerHeight - 100),
      type, data
    });
  };

  const handleTouchStart = (e, type, data) => {
    longPressTimer.current = setTimeout(() => handleContextMenu(e, type, data), 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleTextSelect = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    return text && text.length > 0 ? text : null;
  };

  const formatMessage = (content) => {
    if (!content) return '';
    content = content.replace(/\(??[Oo][Oo][Cc]\s*:[\s\S]*$/gm, (m) => `<details><summary>OOC</summary>${m}</details>`);
    content = content.replace(/(?:```?\w*[\r\n]?)?<(thought|cot|thinking|CoT|think|starter)[\s\S]*?<\/(thought|cot|thinking|CoT|think|starter)>(?:[\r\n]?```?)?/g, '');
    content = content.replace(/<[Ii][Mm][Aa][Gg][Ee][Ii][Nn][Ff][Oo]>[\s\S]*?<\/[Ii][Mm][Aa][Gg][Ee][Ii][Nn][Ff][Oo]>/g, '');
    content = content.replace(/<pic[\s\S]*?(?:<\/pic>|$)/g, '');
    content = content.replace(/<infoblock>[\s\S]*?<\/infoblock>/g, '');
    content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.+?)\*/g, '<em>$1</em>');
    content = content.replace(/"([^"]+)"/g, '<q>"$1"</q>');
    content = content.replace(/\n\n+/g, '</p><p>');
    content = content.replace(/\n/g, '<br>');
    return `<p>${content}</p>`;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '';
  const formatTime = (d) => d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

  if (!sub) return null;

  const themeColor = folderInfo?.color || '#8B0000';
  const latestBookmarkImage = bookmarks[0]?.imageUrl;
  const youtubeId = folderInfo?.youtubeUrl?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];

  // 뷰어
  if (selectedPost) {
    return (
      <>
        <Head><title>{selectedPost.title}</title></Head>
        <div className="viewer-container">
          <div className="viewer-header">
            <h2>{selectedPost.title}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={theme} onChange={(e) => setTheme(Number(e.target.value))} className="theme-select">
                <option value={1}>테마 1</option>
                <option value={2}>테마 2</option>
              </select>
              <button className="btn-back" onClick={() => { closeViewer(); setActiveTab('posts'); }}>← 목록</button>
            </div>
          </div>
          {viewerLoading && <div className="loading"><div className="spinner"></div></div>}
          {!viewerLoading && messages.length > 0 && (
            <div className={`chat-messages theme-${theme}`} ref={viewerRef} onScroll={handleScroll}
              onContextMenu={(e) => {
                const t = handleTextSelect();
                if (t) { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'bookmark', data: { text: t, sourceTitle: selectedPost.title } }); }
              }}>
              {messages.map((msg, i) => {
                const isUser = msg.is_user;
                const name = msg.name || (isUser ? 'User' : 'AI');
                const content = msg.mes || msg.content || msg.message || msg.text || '';
                if (!content) return null;
                return theme === 1 ? (
                  <div key={i} className="mes">
                    <div className="mesAvatarWrapper"><div className="mesIDDisplay">#{i}</div></div>
                    <div className="ch_name" onContextMenu={(e) => handleContextMenu(e, 'message', { index: i })} style={{ cursor: 'pointer' }}>
                      <span className="name_text">{name}</span>
                    </div>
                    <div className="mes_text" dangerouslySetInnerHTML={{ __html: formatMessage(content) }} />
                  </div>
                ) : (
                  <div key={i} className={`sns-message ${isUser ? 'user' : 'ai'}`}>
                    <div className="sns-meta" onContextMenu={(e) => handleContextMenu(e, 'message', { index: i })}><span className="sns-name">{name}</span></div>
                    <div className="sns-bubble" dangerouslySetInnerHTML={{ __html: formatMessage(content) }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {contextMenu && (
          <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
            {contextMenu.type === 'message' && <button onClick={() => { setDeleteTarget({ type: 'message', index: contextMenu.data.index }); setContextMenu(null); }}>🗑️ 삭제</button>}
            {contextMenu.type === 'bookmark' && <button onClick={() => { setBookmarkModal(contextMenu.data); setContextMenu(null); }}>🔖 책갈피</button>}
          </div>
        )}
        {deleteTarget?.type === 'message' && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>삭제?</h3>
              <div className="modal-buttons">
                <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>취소</button>
                <button className="btn-submit btn-danger" onClick={() => handleDeleteMessage(deleteTarget.index)}>삭제</button>
              </div>
            </div>
          </div>
        )}
        {bookmarkModal && (
          <div className="modal-overlay" onClick={() => { setBookmarkModal(null); setBookmarkImage(null); }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>🔖 책갈피</h3>
              <div className="bookmark-preview" style={{ backgroundImage: bookmarkImage ? `url(${URL.createObjectURL(bookmarkImage)})` : `linear-gradient(135deg, ${themeColor}, #111)` }}>
                <div className="bookmark-preview-overlay"><p>{bookmarkModal.text}</p></div>
              </div>
              <div className="form-group"><label>이미지</label><input type="file" accept="image/*" onChange={(e) => setBookmarkImage(e.target.files[0])} /></div>
              <div className="modal-buttons">
                <button className="btn-cancel" onClick={() => { setBookmarkModal(null); setBookmarkImage(null); }}>취소</button>
                <button className="btn-submit" onClick={handleSaveBookmark} disabled={bookmarkSaving}>{bookmarkSaving ? '...' : '저장'}</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // 대시보드
  return (
    <>
      <Head><title>{sub}</title></Head>
      <div className="folder-dashboard" style={{ background: `radial-gradient(ellipse at bottom left, ${themeColor}60 0%, #0a0a0a 60%)` }}>
        
        {/* 홈 버튼 */}
        <Link href="/"><button className="dashboard-home">← 홈</button></Link>

        {/* 왼쪽 상단: 메인 이미지 (책갈피 최신 또는 대표이미지) */}
        <div 
          className="dashboard-main-image" 
          style={{ 
            backgroundImage: latestBookmarkImage ? `url(${latestBookmarkImage})` : folderInfo?.imageUrl ? `url(${folderInfo.imageUrl})` : 'none', 
            borderColor: themeColor 
          }} 
        />

        {/* 왼쪽 하단: 번호 + 장식 */}
        <div className="dashboard-number" style={{ color: themeColor }}>{String(folderIndex).padStart(2, '0')}</div>
        <div className="dashboard-deco">
          <div className="lamp">🪔</div>
          <div className="hearts">❤️❤️</div>
        </div>

        {/* 중앙: 음악 플레이어 */}
        {youtubeId && (
          <div className="dashboard-player">
            <div className="player-icon">💬</div>
            <div className="player-info">
              <small>Now Playing</small>
              <span>{sub}</span>
            </div>
            <button className="player-btn" onClick={() => window.open(folderInfo.youtubeUrl, '_blank')}>▶</button>
          </div>
        )}

        {/* 오른쪽: 메뉴 이미지들 (클릭하면 새로고침) */}
        <div className="dashboard-menu" onClick={() => { fetchPosts(); fetchBookmarks(); fetchFolderInfo(); showToast('새로고침!', 'success'); }}>
          {(folderInfo?.menuImages?.length > 0 ? folderInfo.menuImages : folderInfo?.imageUrl ? [folderInfo.imageUrl] : []).slice(0, 2).map((img, i) => (
            <div key={i} className="menu-img" style={{ backgroundImage: `url(${img})`, borderColor: themeColor, cursor: 'pointer' }} title="클릭하여 새로고침" />
          ))}
        </div>

        {/* 오른쪽 하단: 탭 버튼 */}
        <div className="dashboard-tabs">
          <button onClick={() => setActiveTab('posts')} style={{ background: themeColor }}>목록 ({posts.length})</button>
          <button onClick={() => setActiveTab('bookmarks')} style={{ background: themeColor }}>책갈피 ({bookmarks.length})</button>
        </div>
      </div>

      {/* 목록/책갈피 모달 */}
      {activeTab && !selectedBookmark && (
        <div className="list-modal-overlay" onClick={() => setActiveTab('')}>
          <div className="list-modal" onClick={(e) => e.stopPropagation()}>
            <button className="list-modal-close" onClick={() => setActiveTab('')}>✕</button>
            <h3>{activeTab === 'posts' ? '📄 목록' : '🔖 책갈피'}</h3>
            {activeTab === 'posts' && (
              <ul className="list-items">
                {posts.map(p => (
                  <li key={p.id} onClick={() => openPost(p)} onContextMenu={(e) => handleContextMenu(e, 'post', { post: p })}>
                    <span>{p.title}</span><small>{formatDate(p.createdAt)}</small>
                  </li>
                ))}
                {posts.length === 0 && <li className="empty">없음</li>}
              </ul>
            )}
            {activeTab === 'bookmarks' && (
              <div className="bookmark-grid">
                {bookmarks.map((b, i) => (
                  <div key={i} className="bookmark-item" style={{ backgroundImage: b.imageUrl ? `url(${b.imageUrl})` : `linear-gradient(${themeColor}, #111)` }} onClick={() => setSelectedBookmark(b)}>
                    <p>{b.text.slice(0, 40)}...</p>
                  </div>
                ))}
                {bookmarks.length === 0 && <p className="empty">없음</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenu?.type === 'post' && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => { setDeleteTarget({ type: 'post', ...contextMenu.data.post }); setContextMenu(null); }}>🗑️ 삭제</button>
        </div>
      )}

      {/* 삭제 모달 */}
      {deleteTarget?.type === 'post' && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>삭제?</h3><p>{deleteTarget.title}</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>취소</button>
              <button className="btn-submit btn-danger" onClick={handleDeletePost}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 등록 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>📝 등록</h3>
            <div className="form-group"><label>제목</label><input value={uploadData.title} onChange={(e) => setUploadData({ title: e.target.value })} /></div>
            <div className="form-group"><label>파일</label>
              <div className="file-drop" onClick={() => fileInputRef.current?.click()}>{uploadFile ? uploadFile.name : '선택'}
                <input ref={fileInputRef} type="file" accept=".json,.jsonl" onChange={(e) => setUploadFile(e.target.files[0])} style={{ display: 'none' }} />
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>취소</button>
              <button className="btn-submit" onClick={handleUpload} disabled={uploading}>{uploading ? '...' : '등록'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 책갈피 뷰어 - 닫으면 책갈피 리스트로 */}
      <ImageViewer bookmark={selectedBookmark} onClose={() => { setSelectedBookmark(null); setActiveTab('bookmarks'); }} />
    </>
  );
}
