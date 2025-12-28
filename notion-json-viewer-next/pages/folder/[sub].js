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
  
  const [folderInfo, setFolderInfo] = useState(null);
  const [folderIndex, setFolderIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [messages, setMessages] = useState([]);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [theme, setTheme] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState(null);
  const [bookmarkModal, setBookmarkModal] = useState(null);
  const [bookmarkImage, setBookmarkImage] = useState(null);
  const [bookmarkSaving, setBookmarkSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const viewerRef = useRef(null);
  const longPressTimer = useRef(null);
  
  // 헤더 표시 상태
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollTop = useRef(0);
  
  // 모바일 선택 텍스트 버튼
  const [selectedText, setSelectedText] = useState(null);
  
  // 커스텀 테마
  const [customThemes, setCustomThemes] = useState([]);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeCss, setNewThemeCss] = useState(null);
  const [addingTheme, setAddingTheme] = useState(false);
  const themeFileRef = useRef(null);
  const [customCss, setCustomCss] = useState('');

  // 갤러리 (ZIP 방식)
  const [gallery, setGallery] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);
  const [galleryViewIndex, setGalleryViewIndex] = useState(0);
  const [showGalleryViewer, setShowGalleryViewer] = useState(false);
  
  // 책갈피용 갤러리 선택
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [bookmarkImageUrl, setBookmarkImageUrl] = useState(null);

  // 제목 수정
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const titleLongPressTimer = useRef(null);

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

  useEffect(() => {
    if (sub) {
      fetchFolderInfo();
      fetchPosts();
      fetchBookmarks();
      fetchThemes();
      fetchGallery();
    }
  }, [sub]);

  // 커스텀 테마 CSS 적용
  useEffect(() => {
    if (theme > 2 && customThemes.length > 0) {
      const selectedTheme = customThemes.find((t, i) => i + 3 === theme);
      if (selectedTheme?.cssUrl) {
        fetch(selectedTheme.cssUrl)
          .then(res => res.text())
          .then(css => setCustomCss(css))
          .catch(err => console.error('CSS 로드 실패:', err));
      }
    } else {
      setCustomCss('');
    }
  }, [theme, customThemes]);

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
      const currentScrollTop = viewerRef.current.scrollTop;
      localStorage.setItem(`scroll_${selectedPost.id}`, currentScrollTop.toString());
      
      if (currentScrollTop > lastScrollTop.current && currentScrollTop > 50) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      lastScrollTop.current = currentScrollTop;
    }
  };

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setSelectedText(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 0 && selectedPost) {
        setSelectedText({ text, sourceTitle: selectedPost.title });
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [selectedPost]);

  const fetchFolderInfo = async () => {
    try {
      const res = await fetch('/api/folders');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const folders = data.folders || [];
      const index = folders.findIndex(f => f.name === sub);
      setFolderInfo(folders[index]);
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
      console.error(err);
    } finally {
      setBookmarksLoading(false);
    }
  };

  const fetchThemes = async () => {
    try {
      const res = await fetch(`/api/themes?sub=${encodeURIComponent(sub)}`);
      const data = await res.json();
      if (res.ok) {
        setCustomThemes(data.themes || []);
      }
    } catch (err) {
      console.error('테마 로드 실패:', err);
    }
  };

  const handleAddTheme = async () => {
    if (!newThemeName.trim() || !newThemeCss) {
      showToast('테마 이름과 CSS 파일을 입력해주세요', 'error');
      return;
    }
    setAddingTheme(true);
    try {
      const formData = new FormData();
      formData.append('name', newThemeName);
      formData.append('sub', sub);
      formData.append('cssFile', newThemeCss);

      const res = await fetch('/api/addTheme', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast('테마 추가 완료!', 'success');
      setShowThemeModal(false);
      setNewThemeName('');
      setNewThemeCss(null);
      fetchThemes();
    } catch (err) {
      showToast('테마 추가 실패: ' + err.message, 'error');
    } finally {
      setAddingTheme(false);
    }
  };

  const fetchGallery = async () => {
    try {
      const res = await fetch(`/api/gallery?sub=${encodeURIComponent(sub)}`);
      const data = await res.json();
      if (res.ok) {
        setGallery(data.gallery || []);
        setFavorites((data.gallery || []).filter(g => g.favorite));
      }
    } catch (err) {
      console.error('갤러리 로드 실패:', err);
    }
  };

  // 모든 ZIP 파일 + 일반 이미지에서 추출
  const loadGalleryImages = async () => {
    if (gallery.length === 0) {
      setGalleryImages([]);
      return;
    }

    setGalleryLoading(true);
    try {
      const allImages = [];
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      // ZIP 파일들
      const zipItems = gallery.filter(g => g.isZip && g.fileUrl);
      
      // 일반 이미지 파일들
      const imageItems = gallery.filter(g => {
        if (!g.fileUrl || g.isZip) return false;
        const ext = g.fileName?.toLowerCase() || g.fileUrl.toLowerCase();
        return imageExtensions.some(e => ext.includes(e));
      });

      // 일반 이미지 추가
      for (const img of imageItems) {
        allImages.push({ name: img.name || img.fileName, url: img.fileUrl });
      }

      // ZIP 파일 처리
      if (zipItems.length > 0) {
        const JSZip = (await import('jszip')).default;
        
        for (const zipItem of zipItems) {
          try {
            const response = await fetch(zipItem.fileUrl);
            const blob = await response.blob();
            const zip = await JSZip.loadAsync(blob);
            
            for (const [filename, file] of Object.entries(zip.files)) {
              if (file.dir) continue;
              const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
              if (imageExtensions.includes(ext)) {
                const imageBlob = await file.async('blob');
                const imageUrl = URL.createObjectURL(imageBlob);
                allImages.push({ name: filename, url: imageUrl, zipName: zipItem.name });
              }
            }
          } catch (err) {
            console.error(`ZIP 로드 실패 (${zipItem.name}):`, err);
          }
        }
      }
      
      // 파일명 정렬
      allImages.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setGalleryImages(allImages);
    } catch (err) {
      console.error('갤러리 로드 실패:', err);
      showToast('갤러리 로드 실패', 'error');
    } finally {
      setGalleryLoading(false);
    }
  };

  // 갤러리 모달 열 때 이미지 로드
  const openGallery = async () => {
    setShowGalleryModal(true);
    if (galleryImages.length === 0) {
      await loadGalleryImages();
    }
  };

  // 제목 수정
  const handleTitleEdit = () => {
    setNewTitle(selectedPost.title);
    setEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (!newTitle.trim()) {
      showToast('제목을 입력해주세요', 'error');
      return;
    }
    try {
      const res = await fetch('/api/updateTitle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: selectedPost.id, title: newTitle })
      });
      if (!res.ok) throw new Error('수정 실패');
      
      setSelectedPost({ ...selectedPost, title: newTitle });
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, title: newTitle } : p));
      setEditingTitle(false);
      showToast('제목 수정 완료!', 'success');
    } catch (err) {
      showToast('제목 수정 실패', 'error');
    }
  };

  const handleTitleLongPress = (e) => {
    titleLongPressTimer.current = setTimeout(() => {
      handleTitleEdit();
    }, 500);
  };

  const handleTitleLongPressEnd = () => {
    if (titleLongPressTimer.current) {
      clearTimeout(titleLongPressTimer.current);
    }
  };

  const openPost = async (post) => {
    setSelectedPost(post);
    setViewerLoading(true);
    setMessages([]);
    setShowHeader(true);
    lastScrollTop.current = 0;
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
    setSelectedText(null);
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
      formData.append('sourceTitle', sub); // 폴더 이름으로 저장
      formData.append('sub', sub);
      if (bookmarkImage) {
        formData.append('image', bookmarkImage);
      } else if (bookmarkImageUrl) {
        formData.append('imageUrl', bookmarkImageUrl);
      }
      const res = await fetch('/api/bookmark', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('책갈피 저장!', 'success');
      setBookmarkModal(null);
      setBookmarkImage(null);
      setBookmarkImageUrl(null);
      setSelectedText(null);
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

  const formatMessage = (content) => {
    if (!content) return '';
    
    // OOC 처리
    content = content.replace(/\(??[Oo][Oo][Cc]\s*:[\s\S]*$/gm, (m) => `<details><summary>OOC</summary>${m}</details>`);
    
    // Updated Timeline 처리
    content = content.replace(/### \*\*Updated Timeline\*\*[\s\S]*$/gm, (m) => `<details><summary>Updated Timeline</summary>${m}</details>`);
    
    // ### 로 시작하는 OOC 숨김
    content = content.replace(/^###.*[\s\S]*$/gm, (m) => `<details><summary>OOC Hidden</summary>${m}</details>`);
    
    // thought/cot/thinking 태그 제거
    content = content.replace(/(?:```?\w*[\r\n]?)?<(thought|cot|thinking|CoT|think|starter)([\s\S]*?)<\/(thought|cot|thinking|CoT|think|starter)>(?:[\r\n]?```?)?/g, '');
    
    // imageinfo 태그 제거
    content = content.replace(/<[Ii][Mm][Aa][Gg][Ee][Ii][Nn][Ff][Oo]>[\s\S]*?<\/[Ii][Mm][Aa][Gg][Ee][Ii][Nn][Ff][Oo]>/g, '');
    
    // pic 태그 제거 (다양한 형태)
    content = content.replace(/<\/pic>/g, '');
    content = content.replace(/<pic\s+prompt="[^"]*"\s*\/?>[\s\S]*?(?:<\/pic>)?/g, '');
    content = content.replace(/<pic>[\s\S]*?<\/pic>/g, '');
    content = content.replace(/<pic\s+prompt="[^"]*"\s*\/?>\s*[^<]*/g, '');
    
    // infoblock 제거
    content = content.replace(/<infoblock>[\s\S]*?<\/infoblock>/g, '');
    
    // mes_media_wrapper DIV만 제거 (일반 div는 유지!)
    content = content.replace(/<div class="mes_media_wrapper"[\s\S]*?<\/div>\s*<\/div>/g, '');
    
    // 🥨 Sex Position 제거
    content = content.replace(/🥨 Sex Position[\s\S]*?(?=```|$)/g, '');
    
    // HTML 태그가 있는지 확인 (div, span, table 등)
    const hasHtmlTags = /<div|<span|<table|<ul|<ol|<p\s|<h[1-6]/i.test(content);
    
    if (!hasHtmlTags) {
      // HTML이 없으면 마크다운 처리
      
      // **볼드** 처리
      content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      
      // *이탤릭* 처리
      content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      
      // "따옴표" 처리 - q 태그 사용하지 않고 span으로 (CSS 중첩 방지)
      content = content.replace(/"([^"]+)"/g, '<span class="dialogue">"$1"</span>');
      
      // 줄바꿈 처리
      content = content.replace(/\n\n+/g, '</p><p>');
      content = content.replace(/\n/g, '<br>');
      
      return `<p>${content}</p>`;
    }
    
    // HTML이 있으면 그대로 반환 (마크다운 처리 안 함)
    return content;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '';

  if (!sub) return null;

  const themeColor = folderInfo?.color || '#8B0000';
  const latestBookmarkImage = bookmarks[0]?.imageUrl;

  // 뷰어
  if (selectedPost) {
    return (
      <>
        <Head><title>{selectedPost.title}</title></Head>
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
        <div className="viewer-container">
          <div className={`viewer-header ${showHeader ? '' : 'hidden'}`}>
            {editingTitle ? (
              <div className="title-edit-wrapper">
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                  autoFocus
                  className="title-edit-input"
                />
                <button onClick={handleTitleSave} className="title-edit-btn">✓</button>
                <button onClick={() => setEditingTitle(false)} className="title-edit-btn cancel">✕</button>
              </div>
            ) : (
              <h2 
                onContextMenu={(e) => { e.preventDefault(); handleTitleEdit(); }}
                onTouchStart={handleTitleLongPress}
                onTouchEnd={handleTitleLongPressEnd}
                onMouseDown={handleTitleLongPress}
                onMouseUp={handleTitleLongPressEnd}
                onMouseLeave={handleTitleLongPressEnd}
                style={{ cursor: 'pointer' }}
              >
                {selectedPost.title}
              </h2>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select value={theme} onChange={(e) => setTheme(Number(e.target.value))} className="theme-select">
                <option value={1}>테마 1</option>
                <option value={2}>테마 2</option>
                {customThemes.map((t, i) => (
                  <option key={t.id} value={i + 3}>{t.name}</option>
                ))}
              </select>
              <button className="btn-add-theme" onClick={() => setShowThemeModal(true)}>+</button>
              <button className="btn-back" onClick={() => { closeViewer(); setActiveTab('posts'); }}>← 목록</button>
            </div>
          </div>
          {viewerLoading && <div className="loading"><div className="spinner"></div></div>}
          {!viewerLoading && messages.length > 0 && (
            <div className={`chat-messages theme-${theme}`} ref={viewerRef} onScroll={handleScroll}
              onContextMenu={(e) => {
                const selection = window.getSelection();
                const t = selection?.toString().trim();
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
          
          {selectedText && (
            <button className="mobile-bookmark-btn" onClick={(e) => { e.stopPropagation(); setBookmarkModal(selectedText); }}>
              🔖 책갈피 추가
            </button>
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
          <div className="modal-overlay" onClick={() => { setBookmarkModal(null); setBookmarkImage(null); setBookmarkImageUrl(null); }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>🔖 책갈피</h3>
              <div className="bookmark-preview" style={{ 
                backgroundImage: bookmarkImage 
                  ? `url(${URL.createObjectURL(bookmarkImage)})` 
                  : bookmarkImageUrl 
                    ? `url(${bookmarkImageUrl})` 
                    : `linear-gradient(135deg, ${themeColor}, #111)` 
              }}>
                <div className="bookmark-preview-overlay"><p>{bookmarkModal.text}</p></div>
              </div>
              <div className="form-group">
                <label>이미지</label>
                <div className="bookmark-image-options">
                  <input type="file" accept="image/*" onChange={(e) => { setBookmarkImage(e.target.files[0]); setBookmarkImageUrl(null); }} />
                  <button 
                    type="button" 
                    className="btn-gallery-pick" 
                    onClick={async () => { 
                      if (galleryImages.length === 0) await loadGalleryImages(); 
                      setShowGalleryPicker(true); 
                    }}
                  >
                    🖼️ 갤러리에서 선택
                  </button>
                </div>
              </div>
              <div className="modal-buttons">
                <button className="btn-cancel" onClick={() => { setBookmarkModal(null); setBookmarkImage(null); setBookmarkImageUrl(null); }}>취소</button>
                <button className="btn-submit" onClick={handleSaveBookmark} disabled={bookmarkSaving}>{bookmarkSaving ? '...' : '저장'}</button>
              </div>
            </div>
          </div>
        )}
        
        {/* 갤러리 선택 모달 */}
        {showGalleryPicker && (
          <div className="gallery-picker-overlay" onClick={() => setShowGalleryPicker(false)}>
            <div className="gallery-picker-modal" onClick={(e) => e.stopPropagation()}>
              <div className="gallery-modal-header">
                <h3>🖼️ 이미지 선택</h3>
                <button className="list-modal-close" onClick={() => setShowGalleryPicker(false)}>✕</button>
              </div>
              <div className="gallery-grid">
                {galleryLoading && <p className="loading-text">로딩 중...</p>}
                {!galleryLoading && galleryImages.map((img, i) => (
                  <div key={i} className="gallery-item" onClick={() => { 
                    setBookmarkImageUrl(img.url); 
                    setBookmarkImage(null); 
                    setShowGalleryPicker(false); 
                  }}>
                    <img src={img.url} alt={img.name} />
                  </div>
                ))}
                {!galleryLoading && galleryImages.length === 0 && <p className="empty">갤러리가 비어있습니다</p>}
              </div>
            </div>
          </div>
        )}
        {showThemeModal && (
          <div className="modal-overlay" onClick={() => setShowThemeModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>🎨 테마 추가</h3>
              <div className="form-group">
                <label>테마 이름</label>
                <input 
                  type="text" 
                  value={newThemeName} 
                  onChange={(e) => setNewThemeName(e.target.value)}
                  placeholder="예: 다크모드"
                />
              </div>
              <div className="form-group">
                <label>CSS 파일</label>
                <div className="file-drop" onClick={() => themeFileRef.current?.click()}>
                  {newThemeCss ? `📄 ${newThemeCss.name}` : '클릭하여 CSS 파일 선택'}
                  <input 
                    ref={themeFileRef}
                    type="file" 
                    accept=".css"
                    onChange={(e) => setNewThemeCss(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              <div className="modal-buttons">
                <button className="btn-cancel" onClick={() => setShowThemeModal(false)}>취소</button>
                <button className="btn-submit" onClick={handleAddTheme} disabled={addingTheme}>
                  {addingTheme ? '추가 중...' : '추가'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // 대시보드 v2
  return (
    <>
      <Head><title>{sub}</title></Head>
      <div className="folder-dashboard-v2">
        
        {/* 상단 헤더: 버튼들 */}
        <div className="top-header-area">
          <div></div>
          <div className="top-action-buttons">
            <Link href="/"><button className="minimal-btn" style={{ background: themeColor }}>← Home</button></Link>
            <button className="minimal-btn" style={{ background: themeColor }} onClick={() => setActiveTab('posts')}>목록 ({posts.length})</button>
            <button className="minimal-btn" style={{ background: themeColor }} onClick={() => setActiveTab('bookmarks')}>책갈피 ({bookmarks.length})</button>
            <button className="minimal-btn" style={{ background: themeColor }} onClick={openGallery}>갤러리</button>
          </div>
        </div>

        {/* 메인 그리드 */}
        <div className="main-collage-grid">
          {/* 좌측 메인 구역 */}
          <div className="collage-left">
            <div className="main-image-wrapper" style={{ borderColor: themeColor }} onClick={() => { fetchPosts(); fetchBookmarks(); fetchFolderInfo(); fetchGallery(); }}>
              <img 
                src={folderInfo?.imageUrl || '/placeholder.jpg'} 
                className="main-img-frame" 
                alt="main"
              />
            </div>
            <div className="deco-footer">
              <div className="big-name-display" style={{ WebkitTextStroke: `2px ${themeColor}` }}>
                {(() => {
                  const nameParts = sub.split(' ');
                  // 가장 긴 단어 길이 체크
                  const maxLen = Math.max(...nameParts.map(p => p.length));
                  const isLong = maxLen > 8;
                  
                  if (nameParts.length === 3) {
                    return (
                      <>
                        <span className={`name-first ${isLong ? 'small' : ''}`}>{nameParts[0]}</span>
                        <span className="name-middle">{nameParts[1]}</span>
                        <span className={`name-last ${isLong ? 'small' : ''}`}>{nameParts[2]}</span>
                      </>
                    );
                  } else if (nameParts.length === 2) {
                    return (
                      <>
                        <span className={`name-first ${isLong ? 'small' : ''}`}>{nameParts[0]}</span>
                        <span className={`name-last ${isLong ? 'small' : ''}`}>{nameParts[1]}</span>
                      </>
                    );
                  } else {
                    return <span className={`name-single ${isLong ? 'small' : ''}`}>{sub}</span>;
                  }
                })()}
              </div>
            </div>
          </div>

          {/* 우측 이미지 스택 구역 - 책갈피 이미지 2개 */}
          <div className="collage-right">
            <div className="stack-image-box" style={{ borderColor: themeColor }}>
              <img src={bookmarks[0]?.imageUrl || folderInfo?.imageUrl || '/placeholder.jpg'} alt="stack1" />
            </div>
            <div className="stack-image-box grayscale" style={{ borderColor: themeColor }}>
              <img src={bookmarks[1]?.imageUrl || bookmarks[0]?.imageUrl || folderInfo?.imageUrl || '/placeholder.jpg'} alt="stack2" />
            </div>
          </div>
        </div>
      </div>

      {/* 갤러리 모달 */}
      {showGalleryModal && (
        <div className="modal-overlay" onClick={() => setShowGalleryModal(false)}>
          <div className="gallery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gallery-modal-header">
              <h3>🖼️ 갤러리</h3>
              <button className="list-modal-close" onClick={() => setShowGalleryModal(false)}>✕</button>
            </div>
            <div className="gallery-grid">
              {galleryLoading && <p className="loading-text">로딩 중...</p>}
              {!galleryLoading && galleryImages.map((img, i) => (
                <div key={i} className="gallery-item" onClick={() => { setGalleryViewIndex(i); setShowGalleryViewer(true); }}>
                  <img src={img.url} alt={img.name} />
                </div>
              ))}
              {!galleryLoading && galleryImages.length === 0 && <p className="empty">갤러리가 비어있습니다</p>}
            </div>
          </div>
        </div>
      )}

      {/* 갤러리 슬라이드 뷰어 */}
      {showGalleryViewer && galleryImages.length > 0 && (
        <div className="gallery-viewer-overlay" onClick={() => setShowGalleryViewer(false)}>
          <div className="gallery-viewer" onClick={(e) => e.stopPropagation()}>
            <button className="gallery-nav prev" onClick={() => setGalleryViewIndex((galleryViewIndex - 1 + galleryImages.length) % galleryImages.length)}>‹</button>
            <img src={galleryImages[galleryViewIndex]?.url} alt={galleryImages[galleryViewIndex]?.name} />
            <button className="gallery-nav next" onClick={() => setGalleryViewIndex((galleryViewIndex + 1) % galleryImages.length)}>›</button>
            <div className="gallery-counter">{galleryViewIndex + 1} / {galleryImages.length}</div>
            <button className="gallery-close" onClick={() => setShowGalleryViewer(false)}>✕</button>
          </div>
        </div>
      )}

      {activeTab && !selectedBookmark && (
        <div className="list-modal-overlay" onClick={() => setActiveTab('')}>
          <div className="list-modal" onClick={(e) => e.stopPropagation()}>
            <div className="list-modal-header">
              <h3>{activeTab === 'posts' ? '📄 목록' : '🔖 책갈피'}</h3>
              <div className="list-modal-actions">
                {activeTab === 'posts' && (
                  <button className="list-add-btn" onClick={() => setShowModal(true)} style={{ background: themeColor }}>+</button>
                )}
                <button className="list-modal-close" onClick={() => setActiveTab('')}>✕</button>
              </div>
            </div>
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

      {contextMenu?.type === 'post' && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => { setDeleteTarget({ type: 'post', ...contextMenu.data.post }); setContextMenu(null); }}>🗑️ 삭제</button>
        </div>
      )}

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

      <ImageViewer bookmark={selectedBookmark} onClose={() => { setSelectedBookmark(null); setActiveTab('bookmarks'); }} />
    </>
  );
}
