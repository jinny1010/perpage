import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 뷰어 상태
  const [selectedPost, setSelectedPost] = useState(null);
  const [messages, setMessages] = useState([]);
  const [viewerLoading, setViewerLoading] = useState(false);
  
  // 폴더 열림 상태
  const [openFolders, setOpenFolders] = useState({});
  
  // 테마 (1: 기본, 2: SNS 채팅) - localStorage에서 불러오기
  const [theme, setTheme] = useState(1);
  
  // 등록 모달
  const [showModal, setShowModal] = useState(false);
  const [uploadData, setUploadData] = useState({ sub: '', title: '' });
  const [uploading, setUploading] = useState(false);

  // 삭제 확인 모달
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // 책갈피 모달
  const [bookmarkModal, setBookmarkModal] = useState(null);
  const [bookmarkImage, setBookmarkImage] = useState(null);
  const [bookmarkSaving, setBookmarkSaving] = useState(false);
  const bookmarkImageRef = useRef(null);
  
  // 책갈피 보기
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  
  // 컨텍스트 메뉴
  const [contextMenu, setContextMenu] = useState(null);
  
  // 스크롤 위치 저장용
  const viewerRef = useRef(null);
  const longPressTimer = useRef(null);

  // localStorage에서 테마 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('jsonViewerTheme');
      if (savedTheme) {
        setTheme(Number(savedTheme));
      }
    }
  }, []);

  // 테마 변경 시 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jsonViewerTheme', theme.toString());
    }
  }, [theme]);

  useEffect(() => {
    fetchPosts();
  }, []);

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

  // 스크롤 위치 저장
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
    setError(null);
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to fetch');
      
      setPosts(data.posts || []);
      setGrouped(data.grouped || {});
      
      const folders = {};
      Object.keys(data.grouped || {}).forEach(key => {
        folders[key] = true;
      });
      setOpenFolders(folders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folder) => {
    setOpenFolders(prev => ({
      ...prev,
      [folder]: !prev[folder]
    }));
  };

  const openPost = async (post) => {
    setSelectedPost(post);
    setViewerLoading(true);
    setMessages([]);
    
    try {
      const res = await fetch(`/api/content?pageId=${post.id}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to fetch content');
      
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setViewerLoading(false);
    }
  };

  const closeViewer = () => {
    setSelectedPost(null);
    setMessages([]);
  };

  // 게시글 등록
  const handleUpload = async () => {
    if (!uploadData.sub || !uploadData.title) {
      alert('폴더와 제목을 모두 입력해주세요');
      return;
    }

    setUploading(true);
    try {
      const res = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      alert(`등록 완료!\n\n노션에서 jsonFile에 파일을 직접 업로드해주세요.\n\n${data.notionUrl}`);
      setShowModal(false);
      setUploadData({ sub: '', title: '' });
      fetchPosts();
    } catch (err) {
      alert('등록 실패: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // 게시글 삭제
  const handleDeletePost = async (postId) => {
    try {
      const res = await fetch(`/api/delete?pageId=${postId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert('삭제 완료!');
      setDeleteTarget(null);
      fetchPosts();
    } catch (err) {
      alert('삭제 실패: ' + err.message);
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

  // 롱프레스 핸들러
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

  // 텍스트 선택 후 책갈피
  const handleTextSelect = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    return text && text.length > 0 ? text : null;
  };

  // 책갈피 저장
  const handleSaveBookmark = async () => {
    if (!bookmarkModal?.text) return;
    
    setBookmarkSaving(true);
    try {
      const formData = new FormData();
      formData.append('text', bookmarkModal.text);
      formData.append('sourceTitle', bookmarkModal.sourceTitle || '');
      if (bookmarkImage) {
        formData.append('image', bookmarkImage);
      }

      const res = await fetch('/api/bookmark', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert('책갈피 저장 완료!');
      setBookmarkModal(null);
      setBookmarkImage(null);
    } catch (err) {
      alert('책갈피 저장 실패: ' + err.message);
    } finally {
      setBookmarkSaving(false);
    }
  };

  // 책갈피 목록 불러오기
  const fetchBookmarks = async () => {
    setBookmarksLoading(true);
    try {
      const res = await fetch('/api/bookmarks');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      console.error('책갈피 불러오기 실패:', err.message);
    } finally {
      setBookmarksLoading(false);
    }
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

    const escapeHtml = (text) => {
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

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

  // 책갈피 보기 화면
  if (showBookmarks) {
    return (
      <>
        <Head><title>책갈피 - JSON Viewer</title></Head>
        
        <div className="board-container">
          <div className="viewer-header">
            <h2>🔖 책갈피</h2>
            <button className="btn-back" onClick={() => setShowBookmarks(false)}>← 목록</button>
          </div>

          {bookmarksLoading && (
            <div className="loading"><div className="spinner"></div><p>불러오는 중...</p></div>
          )}

          <div className="bookmarks-grid">
            {bookmarks.map((bookmark, index) => (
              <div key={index} className="bookmark-card" style={{
                backgroundImage: bookmark.imageUrl ? `url(${bookmark.imageUrl})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}>
                <div className="bookmark-overlay">
                  <p className="bookmark-text">{bookmark.text}</p>
                  <small className="bookmark-source">{bookmark.sourceTitle}</small>
                </div>
              </div>
            ))}
          </div>

          {!bookmarksLoading && bookmarks.length === 0 && (
            <div className="empty-state"><div className="icon">🔖</div><p>저장된 책갈피가 없습니다</p></div>
          )}
        </div>
      </>
    );
  }

  // 뷰어 화면
  if (selectedPost) {
    return (
      <>
        <Head><title>{selectedPost.title} - JSON Viewer</title></Head>
        
        <div className="viewer-container">
          <div className="viewer-header">
            <h2>{selectedPost.title}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select value={theme} onChange={(e) => setTheme(Number(e.target.value))} className="theme-select">
                <option value={1}>테마 1 (기본)</option>
                <option value={2}>테마 2 (SNS)</option>
              </select>
              <button className="btn-back" onClick={closeViewer}>← 목록</button>
            </div>
          </div>

          {viewerLoading && (<div className="loading"><div className="spinner"></div><p>불러오는 중...</p></div>)}
          {error && (<div className="error">⚠️ {error}</div>)}

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
                      <div className="ch_name">
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
                    <div className="sns-meta">
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
        {contextMenu && contextMenu.type === 'bookmark' && (
          <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
            <button onClick={() => { setBookmarkModal(contextMenu.data); setContextMenu(null); }}>
              🔖 책갈피 추가
            </button>
          </div>
        )}

        {/* 책갈피 모달 */}
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

  // 게시판 화면
  return (
    <>
      <Head><title>JSON Viewer</title></Head>

      <div className="board-container">
        <div className="board-header">
          <h1>📄 JSON Viewer</h1>
          <p>노션 DB의 채팅 로그를 확인하세요</p>
        </div>

        {loading && (<div className="loading"><div className="spinner"></div><p>불러오는 중...</p></div>)}
        {error && (<div className="error">⚠️ {error}</div>)}

        {!loading && Object.keys(grouped).length === 0 && (
          <div className="empty-state"><div className="icon">📁</div><p>등록된 게시글이 없습니다</p></div>
        )}

        {!loading && Object.entries(grouped).map(([folder, folderPosts]) => (
          <div key={folder} className="folder-section">
            <div className="folder-header" onClick={() => toggleFolder(folder)}>
              <span className="icon">{openFolders[folder] ? '📂' : '📁'}</span>
              <span>{folder}</span>
              <span className="count">{folderPosts.length}</span>
            </div>
            
            {openFolders[folder] && (
              <ul className="post-list">
                {folderPosts.map(post => (
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
            )}
          </div>
        ))}

        <div className="floating-menu">
          <button className="floating-btn bookmark-view-btn" onClick={() => { setShowBookmarks(true); fetchBookmarks(); }} title="책갈피 보기">🔖</button>
          <button className="floating-btn add-btn" onClick={() => setShowModal(true)} title="새 글 등록">+</button>
          <button className="floating-btn refresh-btn" onClick={fetchPosts} title="새로고침">🔄</button>
        </div>
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && contextMenu.type === 'post' && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => { setDeleteTarget({ type: 'post', id: contextMenu.data.post.id, title: contextMenu.data.post.title }); setContextMenu(null); }}>
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
              <button className="btn-submit btn-danger" onClick={() => handleDeletePost(deleteTarget.id)}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 등록 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>📝 새 글 등록</h3>
            <div className="form-group">
              <label>폴더 (sub)</label>
              <input type="text" placeholder="예: 바론, 킬리언" value={uploadData.sub} onChange={(e) => setUploadData({...uploadData, sub: e.target.value})} />
            </div>
            <div className="form-group">
              <label>제목 (title)</label>
              <input type="text" placeholder="게시글 제목" value={uploadData.title} onChange={(e) => setUploadData({...uploadData, title: e.target.value})} />
            </div>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>💡 등록 후 노션에서 jsonFile에 파일을 직접 업로드해주세요</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>취소</button>
              <button className="btn-submit" onClick={handleUpload} disabled={uploading}>{uploading ? '등록 중...' : '등록'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
