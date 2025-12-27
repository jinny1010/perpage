import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useToast } from '../../components/Toast';
import ImageViewer from '../../components/ImageViewer';

export default function FolderPage() {
  const router = useRouter();
  const { sub } = router.query;
  const { showToast, showConfirm } = useToast();
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'bookmarks'
  
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
  
  // 스크롤
  const viewerRef = useRef(null);
  const longPressTimer = useRef(null);

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

  // 등록
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
      if (uploadFile) {
        formData.append('file', uploadFile);
      }

      const res = await fetch('/api/create', {
        method: 'POST',
        body: formData,
      });

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

  // 게시글 삭제
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

  // 메시지 삭제
  const handleDeleteMessage = async (index) => {
    try {
      const res = await fetch('/api/deleteMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: selectedPost.id,
          messageIndex: index,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const updatedMessages = [...messages];
      updatedMessages.splice(index, 1);
      setMessages(updatedMessages);
      setDeleteTarget(null);
      showToast('메시지 삭제됨', 'success');
    } catch (err) {
      showToast('메시지 삭제 실패: ' + err.message, 'error');
    }
  };

  // 책갈피 저장
  const handleSaveBookmark = async () => {
    if (!bookmarkModal?.text) return;
    
    setBookmarkSaving(true);
    try {
      const formData = new FormData();
      formData.append('text', bookmarkModal.text);
      formData.append('sourceTitle', bookmarkModal.sourceTitle || '');
      formData.append('sub', sub);
      if (bookmarkImage) {
        formData.append('image', bookmarkImage);
      }

      const res = await fetch('/api/bookmark', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast('책갈피 저장 완료!', 'success');
      setBookmarkModal(null);
      setBookmarkImage(null);
      fetchBookmarks();
    } catch (err) {
      showToast('책갈피 저장 실패: ' + err.message, 'error');
    } finally {
      setBookmarkSaving(false);
    }
  };

  // 컨텍스트 메뉴
  const handleContextMenu = (e, type, data) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: Math.min(e.clientX || 100, window.innerWidth - 150),
      y: Math.min(e.clientY || 100, window.innerHeight - 100),
      type,
      data
    });
  };

  const handleTouchStart = (e, type, data) => {
    longPressTimer.current = setTimeout(() => {
      handleContextMenu(e, type, data);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleTextSelect = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    return text && text.length > 0 ? text : null;
  };

  // 메시지 포맷팅
  const formatMessage = (content) => {
    if (!content) return '';
    
    content = content.replace(/\(??[Oo][Oo][Cc]\s*:[\s\S]*$/gm, (match) => {
      return `<details><summary>OOC Hidden</summary>${match}</details>`;
    });
    content = content.replace(/(?:```?\w*[\r\n]?)?<(thought|cot|thinking|CoT|think|starter)[\s\S]*?<\/(thought|cot|thinking|CoT|think|starter)>(?:[\r\n]?```?)?/g, '');
    content = content.replace(/<[Ii][Mm][Aa][Gg][Ee][Ii][Nn][Ff][Oo]>[\s\S]*?<\/[Ii][Mm][Aa][Gg][Ee][Ii][Nn][Ff][Oo]>/g, '');
    content = content.replace(/<pic\s+prompt="[^"]*"\s*\/?>[\s\S]*?(?:<\/pic>)?/g, '');
    content = content.replace(/<pic>[\s\S]*?<\/pic>/g, '');
    content = content.replace(/<\/pic>/g, '');
    content = content.replace(/<infoblock>[\s\S]*?<\/infoblock>/g, '');

    const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const codeBlocks = [];
    content = content.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      codeBlocks.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
      return `___CODEBLOCK_${codeBlocks.length - 1}___`;
    });

    const inlineCodes = [];
    content = content.replace(/`([^`]+)`/g, (match, code) => {
      inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
      return `___INLINE_${inlineCodes.length - 1}___`;
    });

    content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.+?)\*/g, '<em>$1</em>');
    content = content.replace(/_(.+?)_/g, '<em>$1</em>');
    content = content.replace(/"([^"]+)"/g, '<q>"$1"</q>');

    codeBlocks.forEach((block, i) => {
      content = content.replace(`___CODEBLOCK_${i}___`, block);
    });
    inlineCodes.forEach((code, i) => {
      content = content.replace(`___INLINE_${i}___`, code);
    });

    content = content.replace(/\n\n+/g, '</p><p>');
    content = content.replace(/\n/g, '<br>');
    content = `<p>${content}</p>`;

    return content;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (!sub) return null;

  // 뷰어 화면
  if (selectedPost) {
    return (
      <>
        <Head><title>{selectedPost.title} - {sub}</title></Head>
        
        <div className="viewer-container">
          <div className="viewer-header">
            <h2>{selectedPost.title}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select value={theme} onChange={(e) => setTheme(Number(e.target.value))} className="theme-select">
                <option value={1}>테마 1</option>
                <option value={2}>테마 2</option>
              </select>
              <button className="btn-back" onClick={closeViewer}>← 목록</button>
            </div>
          </div>

          {viewerLoading && (<div className="loading"><div className="spinner"></div><p>불러오는 중...</p></div>)}

          {!viewerLoading && messages.length > 0 && (
            <div 
              className={`chat-messages theme-${theme}`}
              ref={viewerRef}
              onScroll={handleScroll}
              onContextMenu={(e) => {
                const selectedText = handleTextSelect();
                if (selectedText) {
                  e.preventDefault();
                  setContextMenu({
                    x: Math.min(e.clientX, window.innerWidth - 150),
                    y: Math.min(e.clientY, window.innerHeight - 100),
                    type: 'bookmark',
                    data: { text: selectedText, sourceTitle: selectedPost.title }
                  });
                }
              }}
            >
              {messages.map((msg, index) => {
                const isUser = msg.is_user;
                const charName = msg.name || (isUser ? 'User' : 'AI');
                const content = msg.mes || msg.content || msg.message || msg.text || '';
                const timestamp = msg.send_date || '';
                const tokenCount = msg.extra?.token_count;

                if (!content) return null;

                if (theme === 1) {
                  return (
                    <div key={index} className="mes">
                      <div className="mesAvatarWrapper" style={{ flexDirection: isUser ? 'row-reverse' : 'row' }}>
                        <div className="mesIDDisplay">#{index}</div>
                        {tokenCount && <div className="tokenCounterDisplay">{tokenCount}t</div>}
                      </div>
                      <div 
                        className="ch_name"
                        onContextMenu={(e) => handleContextMenu(e, 'message', { index })}
                        onTouchStart={(e) => handleTouchStart(e, 'message', { index })}
                        onTouchEnd={handleTouchEnd}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="name_text">{charName}</span>
                          {timestamp && <small className="timestamp">{timestamp}</small>}
                        </div>
                      </div>
                      <div className="mes_text" dangerouslySetInnerHTML={{ __html: formatMessage(content) }} />
                    </div>
                  );
                }

                return (
                  <div key={index} className={`sns-message ${isUser ? 'user' : 'ai'}`}>
                    <div 
                      className="sns-meta"
                      onContextMenu={(e) => handleContextMenu(e, 'message', { index })}
                      onTouchStart={(e) => handleTouchStart(e, 'message', { index })}
                      onTouchEnd={handleTouchEnd}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="sns-name">{charName}</span>
                      {timestamp && <span className="sns-time">{timestamp}</span>}
                    </div>
                    <div className="sns-bubble" dangerouslySetInnerHTML={{ __html: formatMessage(content) }} />
                  </div>
                );
              })}
            </div>
          )}

          <div className="floating-menu">
            <button className="floating-btn" onClick={closeViewer} title="목록으로">←</button>
          </div>
        </div>

        {/* 컨텍스트 메뉴 */}
        {contextMenu && (
          <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
            {contextMenu.type === 'message' && (
              <button onClick={() => { setDeleteTarget({ type: 'message', index: contextMenu.data.index }); setContextMenu(null); }}>
                🗑️ 메시지 삭제
              </button>
            )}
            {contextMenu.type === 'bookmark' && (
              <button onClick={() => { setBookmarkModal(contextMenu.data); setContextMenu(null); }}>
                🔖 책갈피 추가
              </button>
            )}
          </div>
        )}

        {/* 메시지 삭제 확인 모달 */}
        {deleteTarget?.type === 'message' && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>⚠️ 메시지 삭제</h3>
              <p>이 메시지를 삭제하시겠습니까?</p>
              <div className="modal-buttons">
                <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>취소</button>
                <button className="btn-submit btn-danger" onClick={() => handleDeleteMessage(deleteTarget.index)}>삭제</button>
              </div>
            </div>
          </div>
        )}

        {/* 책갈피 추가 모달 */}
        {bookmarkModal && (
          <div className="modal-overlay" onClick={() => { setBookmarkModal(null); setBookmarkImage(null); }}>
            <div className="modal bookmark-modal" onClick={(e) => e.stopPropagation()}>
              <h3>🔖 책갈피 추가</h3>
              
              <div className="bookmark-preview" style={{
                backgroundImage: bookmarkImage ? `url(${URL.createObjectURL(bookmarkImage)})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <div className="bookmark-preview-overlay">
                  <p>{bookmarkModal.text}</p>
                </div>
              </div>
              
              <div className="form-group">
                <label>배경 이미지 (선택)</label>
                <input ref={bookmarkImageRef} type="file" accept="image/*" onChange={(e) => setBookmarkImage(e.target.files[0])} />
              </div>
              
              <div className="modal-buttons">
                <button className="btn-cancel" onClick={() => { setBookmarkModal(null); setBookmarkImage(null); }}>취소</button>
                <button className="btn-submit" onClick={handleSaveBookmark} disabled={bookmarkSaving}>
                  {bookmarkSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // 메인 화면 (탭: 목록 / 책갈피)
  return (
    <>
      <Head><title>{sub} - JSON Viewer</title></Head>

      <div className="folder-page-container">
        <div className="folder-page-header">
          <Link href="/">
            <button className="btn-home">← 홈</button>
          </Link>
          <h1>{sub}</h1>
        </div>

        {/* 탭 */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            📄 목록 ({posts.length})
          </button>
          <button 
            className={`tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            🔖 책갈피 ({bookmarks.length})
          </button>
        </div>

        {/* 목록 탭 */}
        {activeTab === 'posts' && (
          <>
            {loading && (<div className="loading"><div className="spinner"></div><p>불러오는 중...</p></div>)}

            {!loading && posts.length === 0 && (
              <div className="empty-state"><div className="icon">📄</div><p>등록된 게시글이 없습니다</p></div>
            )}

            <ul className="post-list">
              {posts.map(post => (
                <li 
                  key={post.id} 
                  className="post-item"
                  onClick={() => openPost(post)}
                  onContextMenu={(e) => handleContextMenu(e, 'post', { post })}
                  onTouchStart={(e) => handleTouchStart(e, 'post', { post })}
                  onTouchEnd={handleTouchEnd}
                >
                  <span className="post-icon">📄</span>
                  <span className="post-title">{post.title}</span>
                  <span className="post-date">{formatDate(post.createdAt)}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* 책갈피 탭 */}
        {activeTab === 'bookmarks' && (
          <>
            {bookmarksLoading && (<div className="loading"><div className="spinner"></div><p>불러오는 중...</p></div>)}

            {!bookmarksLoading && bookmarks.length === 0 && (
              <div className="empty-state"><div className="icon">🔖</div><p>저장된 책갈피가 없습니다</p></div>
            )}

            <div className="bookmarks-grid">
              {bookmarks.map((bookmark, index) => (
                <div 
                  key={index} 
                  className="bookmark-card"
                  style={{
                    backgroundImage: bookmark.imageUrl 
                      ? `url(${bookmark.imageUrl})` 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                  onClick={() => setSelectedBookmark(bookmark)}
                >
                  <div className="bookmark-overlay">
                    <p className="bookmark-text">{bookmark.text.length > 100 ? bookmark.text.substring(0, 100) + '...' : bookmark.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 플로팅 버튼 */}
        <div className="floating-menu">
          <button className="floating-btn add-btn" onClick={() => setShowModal(true)} title="새 글 등록">+</button>
          <button className="floating-btn refresh-btn" onClick={() => { fetchPosts(); fetchBookmarks(); }} title="새로고침">🔄</button>
        </div>
      </div>

      {/* 게시글 삭제 컨텍스트 메뉴 */}
      {contextMenu && contextMenu.type === 'post' && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => { setDeleteTarget({ type: 'post', ...contextMenu.data.post }); setContextMenu(null); }}>
            🗑️ 삭제
          </button>
        </div>
      )}

      {/* 게시글 삭제 확인 모달 */}
      {deleteTarget?.type === 'post' && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ 게시글 삭제</h3>
            <p>"{deleteTarget.title}"을(를) 삭제하시겠습니까?</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>취소</button>
              <button className="btn-submit btn-danger" onClick={handleDeletePost}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 등록 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setUploadFile(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>📝 새 글 등록</h3>
            <div className="form-group">
              <label>제목</label>
              <input type="text" placeholder="게시글 제목" value={uploadData.title} onChange={(e) => setUploadData({...uploadData, title: e.target.value})} />
            </div>
            <div className="form-group">
              <label>JSON 파일 (선택)</label>
              <div className="file-drop" onClick={() => fileInputRef.current?.click()}>
                {uploadFile ? <span>📄 {uploadFile.name}</span> : <span>클릭하여 파일 선택</span>}
                <input ref={fileInputRef} type="file" accept=".json,.jsonl" onChange={(e) => setUploadFile(e.target.files[0])} style={{ display: 'none' }} />
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => { setShowModal(false); setUploadFile(null); }}>취소</button>
              <button className="btn-submit" onClick={handleUpload} disabled={uploading}>{uploading ? '등록 중...' : '등록'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 책갈피 전체화면 뷰어 */}
      <ImageViewer bookmark={selectedBookmark} onClose={() => setSelectedBookmark(null)} />
    </>
  );
}
