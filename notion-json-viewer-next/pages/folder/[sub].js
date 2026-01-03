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
  
  // 메인 이미지 수정 모달
  const [showMainImageModal, setShowMainImageModal] = useState(false);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImageSaving, setMainImageSaving] = useState(false);
  const mainImageInputRef = useRef(null);
  
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
  const [visibleCount, setVisibleCount] = useState(30); // 처음에 30개만 보여주기
  const galleryGridRef = useRef(null);
  
  // 책갈피용 갤러리 선택
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [bookmarkImageUrl, setBookmarkImageUrl] = useState(null);

  // Private 갤러리 (이름에 19 포함)
  const [isPrivateGallery, setIsPrivateGallery] = useState(false);
  const [privateUnlocked, setPrivateUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
      const plainText = selection?.toString().trim();
      if (plainText && plainText.length > 0 && selectedPost) {
        // HTML 포함해서 가져오기
        let htmlText = plainText;
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const div = document.createElement('div');
          div.appendChild(range.cloneContents());
          htmlText = div.innerHTML;
        }
        setSelectedText({ text: htmlText, sourceTitle: selectedPost.title });
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
        const galleryData = data.gallery || [];
        setGallery(galleryData);
        setFavorites(galleryData.filter(g => g.favorite));
        
        // private 체크박스가 true인 항목이 있는지 확인
        const hasPrivate = galleryData.some(g => g.isPrivate === true);
        setIsPrivateGallery(hasPrivate);
      }
    } catch (err) {
      console.error('갤러리 로드 실패:', err);
    }
  };

  // 모든 ZIP 파일 + 일반 이미지에서 추출
  // showPrivateOnly: true면 private=true인 것만, false면 private=false인 것만
  const loadGalleryImages = async (showPrivateOnly = false) => {
    if (gallery.length === 0) {
      setGalleryImages([]);
      return;
    }

    setGalleryLoading(true);
    try {
      const allImages = [];
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      // showPrivateOnly에 따라 필터링
      const filteredGallery = showPrivateOnly 
        ? gallery.filter(g => g.isPrivate === true)  // private만
        : gallery.filter(g => !g.isPrivate);          // private 아닌 것만
      
      // ZIP 파일들
      const zipItems = filteredGallery.filter(g => g.isZip && g.fileUrl);
      
      // 일반 이미지 파일들
      const imageItems = filteredGallery.filter(g => {
        if (!g.fileUrl || g.isZip) return false;
        const ext = g.fileName?.toLowerCase() || g.fileUrl.toLowerCase();
        return imageExtensions.some(e => ext.includes(e));
      });

      // 일반 이미지 추가 (Notion URL에서 파일명 추출)
      for (const img of imageItems) {
        // Notion URL에서 파일명 추출
        // 형식: https://www.notion.so/image/attachment%3A...%3AKillian_Vane_2025-12-2121h45m28s.png?...
        let fileName = img.name || img.fileName || '';
        if (!fileName && img.fileUrl) {
          const urlMatch = img.fileUrl.match(/%3A([^%?]+\.(?:png|jpg|jpeg|gif|webp))/i);
          if (urlMatch) {
            fileName = decodeURIComponent(urlMatch[1]);
          }
        }
        allImages.push({ name: fileName, url: img.fileUrl });
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
      
      // 파일명에서 날짜/시간 추출해서 정렬 (최신이 위로)
      // 형식: Killian_Vane_2025-12-2121h45m28s.png
      const extractDateTime = (name) => {
        // 파일명에서 날짜시간 패턴 찾기
        const match = name?.match(/(\d{4}-\d{1,2}-\d{1,2})(\d{1,2}h\d{1,2}m\d{1,2}s)?/);
        if (match) {
          const datePart = match[1]; // 2025-12-21
          const timePart = match[2] || '00h00m00s'; // 21h45m28s
          
          // 시간 파싱
          const timeMatch = timePart.match(/(\d+)h(\d+)m(\d+)s/);
          const hours = timeMatch ? parseInt(timeMatch[1]) : 0;
          const mins = timeMatch ? parseInt(timeMatch[2]) : 0;
          const secs = timeMatch ? parseInt(timeMatch[3]) : 0;
          
          const dateStr = `${datePart}T${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
          return new Date(dateStr).getTime();
        }
        return 0;
      };
      
      // 최신순 정렬 (날짜가 큰 게 먼저)
      allImages.sort((a, b) => {
        const dateA = extractDateTime(a.name);
        const dateB = extractDateTime(b.name);
        return dateB - dateA; // 내림차순 (최신이 위)
      });
      
      setGalleryImages(allImages);
    } catch (err) {
      console.error('갤러리 로드 실패:', err);
      showToast('갤러리 로드 실패', 'error');
    } finally {
      setGalleryLoading(false);
    }
  };

  // 갤러리 모달 열 때 - private 체크 안 된 것만
  const openGallery = async () => {
    setVisibleCount(30);
    setShowGalleryModal(true);
    await loadGalleryImages(false); // private=false 인 것만
  };
  
  // Private 갤러리 열기
  const openPrivateGallery = () => {
    setShowPasswordModal(true);
  };
  
  // 비밀번호 확인 - private 체크 된 것만
  const handlePasswordSubmit = async () => {
    if (passwordInput === '0406') {
      setPrivateUnlocked(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError('');
      setVisibleCount(30);
      setShowGalleryModal(true);
      await loadGalleryImages(true); // private=true 인 것만
    } else {
      setPasswordError('비밀번호가 틀렸습니다');
    }
  };
  
  // 갤러리 스크롤 시 더 로드
  const handleGalleryScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      setVisibleCount(prev => Math.min(prev + 30, galleryImages.length));
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

  const handleDeleteBookmark = async () => {
    if (!deleteTarget?.id) return;
    try {
      const res = await fetch(`/api/deleteBookmark?pageId=${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('책갈피 삭제 완료!', 'success');
      setDeleteTarget(null);
      fetchBookmarks();
    } catch (err) {
      showToast('삭제 실패: ' + err.message, 'error');
    }
  };

  // 롱프레스 핸들러
  const handleLongPressStart = (e, type, data) => {
    e.preventDefault();
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches?.[0] || e;
      setContextMenu({
        x: Math.min(touch.clientX || 100, window.innerWidth - 150),
        y: Math.min(touch.clientY || 100, window.innerHeight - 100),
        type,
        data
      });
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // 메인 이미지 수정
  const handleMainImageSave = async () => {
    if (!mainImageFile) return;
    setMainImageSaving(true);
    try {
      const formData = new FormData();
      formData.append('folderId', folderInfo.id);
      formData.append('image', mainImageFile);
      const res = await fetch('/api/updateFolder', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('이미지 수정 완료!', 'success');
      setShowMainImageModal(false);
      setMainImageFile(null);
      fetchFolderInfo();
    } catch (err) {
      showToast('수정 실패: ' + err.message, 'error');
    } finally {
      setMainImageSaving(false);
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
    
    // 🥨 Sex Position 제거
    content = content.replace(/🥨 Sex Position[\s\S]*?(?=```|$)/g, '');
    
    // HTML 블록(div) 추출 후 마크다운 처리
    const htmlBlocks = [];
    content = content.replace(/<div[\s\S]*?<\/div>/gi, (match) => {
      const placeholder = `__HTML_BLOCK_${htmlBlocks.length}__`;
      // position: absolute를 relative로 변경
      let fixed = match.replace(/position:\s*absolute/gi, 'position: relative');
      // img에 max-width 추가
      fixed = fixed.replace(/<img([^>]*)>/gi, (m, attrs) => {
        if (!/max-width/i.test(attrs)) {
          if (/style\s*=/i.test(attrs)) {
            return m.replace(/style\s*=\s*"([^"]*)"/i, 'style="$1; max-width: 100%; height: auto;"');
          } else {
            return `<img${attrs} style="max-width: 100%; height: auto;">`;
          }
        }
        return m;
      });
      htmlBlocks.push(fixed);
      return placeholder;
    });
    
    // 마크다운 처리 (DIV 제외한 텍스트)
    // **볼드** 처리
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // *이탤릭* 처리
    content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // "따옴표" 처리
    content = content.replace(/"([^"]+)"/g, '<span class="dialogue">"$1"</span>');
    
    // 줄바꿈 처리
    content = content.replace(/\n\n+/g, '</p><p>');
    content = content.replace(/\n/g, '<br>');
    
    // HTML 블록 복원
    htmlBlocks.forEach((block, i) => {
      content = content.replace(`__HTML_BLOCK_${i}__`, block);
    });
    
    return `<p>${content}</p>`;
    
    // HTML이 있으면 이미지 스타일 보정 후 반환
    // img 태그에 max-width 스타일이 없으면 추가
    content = content.replace(/<img([^>]*)>/gi, (match, attrs) => {
      if (!/max-width/i.test(attrs)) {
        // style 속성이 있으면 거기에 추가, 없으면 새로 생성
        if (/style\s*=/i.test(attrs)) {
          return match.replace(/style\s*=\s*"([^"]*)"/i, 'style="$1; max-width: 100%; height: auto;"');
        } else {
          return `<img${attrs} style="max-width: 100%; height: auto;">`;
        }
      }
      return match;
    });
    
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
                const plainText = selection?.toString().trim();
                if (plainText) { 
                  e.preventDefault(); 
                  // HTML 포함해서 가져오기
                  let htmlText = plainText;
                  if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const div = document.createElement('div');
                    div.appendChild(range.cloneContents());
                    htmlText = div.innerHTML;
                  }
                  setContextMenu({ x: e.clientX, y: e.clientY, type: 'bookmark', data: { text: htmlText, sourceTitle: selectedPost.title } }); 
                }
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
                      await loadGalleryImages(false); // 항상 일반 갤러리만 (private=false)
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
            <button className="minimal-btn" style={{ background: '#333' }} onClick={openPrivateGallery}>
              🔒 Private
            </button>
          </div>
        </div>

        {/* 메인 그리드 */}
        <div className="main-collage-grid">
          {/* 좌측 메인 구역 */}
          <div className="collage-left">
            <div 
              className="main-image-wrapper" 
              style={{ borderColor: themeColor }} 
              onClick={() => { fetchPosts(); fetchBookmarks(); fetchFolderInfo(); fetchGallery(); }}
              onContextMenu={(e) => { e.preventDefault(); setShowMainImageModal(true); }}
              onTouchStart={(e) => {
                longPressTimer.current = setTimeout(() => {
                  setShowMainImageModal(true);
                }, 500);
              }}
              onTouchEnd={handleLongPressEnd}
              onTouchMove={handleLongPressEnd}
            >
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
                  const isLong = maxLen >= 8;      // 8자 이상이면 small
                  const isVeryLong = maxLen >= 10; // 10자 이상이면 xsmall
                  const sizeClass = isVeryLong ? 'xsmall' : isLong ? 'small' : '';
                  
                  if (nameParts.length === 3) {
                    return (
                      <>
                        <span className={`name-first ${sizeClass}`}>{nameParts[0]}</span>
                        <span className="name-middle">{nameParts[1]}</span>
                        <span className={`name-last ${sizeClass}`}>{nameParts[2]}</span>
                      </>
                    );
                  } else if (nameParts.length === 2) {
                    return (
                      <>
                        <span className={`name-first ${sizeClass}`}>{nameParts[0]}</span>
                        <span className={`name-last ${sizeClass}`}>{nameParts[1]}</span>
                      </>
                    );
                  } else {
                    return <span className={`name-single ${sizeClass}`}>{sub}</span>;
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
              <h3>🖼️ {privateUnlocked ? '🔒 Private' : '갤러리'}</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#888' }}>{galleryImages.length}장</span>
                <button className="list-modal-close" onClick={() => { setShowGalleryModal(false); setPrivateUnlocked(false); }}>✕</button>
              </div>
            </div>
            <div className="gallery-grid" ref={galleryGridRef} onScroll={handleGalleryScroll}>
              {galleryLoading && <p className="loading-text">로딩 중...</p>}
              {!galleryLoading && galleryImages.slice(0, visibleCount).map((img, i) => (
                <div key={i} className="gallery-item" onClick={() => { setGalleryViewIndex(i); setShowGalleryViewer(true); }}>
                  <img 
                    src={img.url} 
                    alt={img.name} 
                    loading="lazy"
                  />
                </div>
              ))}
              {!galleryLoading && galleryImages.length === 0 && <p className="empty">갤러리가 비어있습니다</p>}
              {!galleryLoading && visibleCount < galleryImages.length && (
                <p className="loading-text" style={{ gridColumn: '1 / -1' }}>스크롤하면 더 로드됩니다... ({visibleCount}/{galleryImages.length})</p>
              )}
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
                  <div 
                    key={i} 
                    className="bookmark-item" 
                    style={{ backgroundImage: b.imageUrl ? `url(${b.imageUrl})` : `linear-gradient(${themeColor}, #111)` }} 
                    onClick={() => setSelectedBookmark(b)}
                    onContextMenu={(e) => handleContextMenu(e, 'bookmark-delete', { bookmark: b })}
                    onTouchStart={(e) => handleLongPressStart(e, 'bookmark-delete', { bookmark: b })}
                    onTouchEnd={handleLongPressEnd}
                    onTouchMove={handleLongPressEnd}
                  >
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

      {contextMenu?.type === 'bookmark-delete' && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => { setDeleteTarget({ type: 'bookmark', ...contextMenu.data.bookmark }); setContextMenu(null); }}>🗑️ 삭제</button>
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

      {deleteTarget?.type === 'bookmark' && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>책갈피 삭제?</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>{deleteTarget.text?.slice(0, 50)}...</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>취소</button>
              <button className="btn-submit btn-danger" onClick={handleDeleteBookmark}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 메인 이미지 수정 모달 */}
      {showMainImageModal && (
        <div className="modal-overlay" onClick={() => { setShowMainImageModal(false); setMainImageFile(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>🖼️ 메인 이미지 수정</h3>
            <div className="form-group">
              <div 
                className="file-drop" 
                onClick={() => mainImageInputRef.current?.click()}
                style={{ 
                  backgroundImage: mainImageFile ? `url(${URL.createObjectURL(mainImageFile)})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '150px'
                }}
              >
                {!mainImageFile && '클릭하여 이미지 선택'}
                <input 
                  ref={mainImageInputRef}
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setMainImageFile(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => { setShowMainImageModal(false); setMainImageFile(null); }}>취소</button>
              <button className="btn-submit" onClick={handleMainImageSave} disabled={!mainImageFile || mainImageSaving}>
                {mainImageSaving ? '저장 중...' : '저장'}
              </button>
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
      
      {/* 비밀번호 입력 모달 */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => { setShowPasswordModal(false); setPasswordInput(''); setPasswordError(''); }}>
          <div className="modal password-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🔒 Private Gallery</h3>
            <p style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>비밀번호를 입력하세요</p>
            <div className="form-group">
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="비밀번호"
                autoFocus
                style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '8px' }}
              />
            </div>
            {passwordError && <p style={{ color: '#e74c3c', fontSize: '13px', marginBottom: '10px' }}>{passwordError}</p>}
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => { setShowPasswordModal(false); setPasswordInput(''); setPasswordError(''); }}>취소</button>
              <button className="btn-submit" onClick={handlePasswordSubmit}>확인</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
