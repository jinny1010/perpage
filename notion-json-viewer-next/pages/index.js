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
  
  // 테마 (1: 기본, 2: SNS 채팅)
  const [theme, setTheme] = useState(1);
  
  // 등록 모달
  const [showModal, setShowModal] = useState(false);
  const [uploadData, setUploadData] = useState({ sub: '', title: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPosts();
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
      
      // 모든 폴더 열어두기
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

  // 파일 업로드
  const handleUpload = async () => {
    if (!uploadData.sub || !uploadData.title || !uploadFile) {
      alert('폴더, 제목, 파일을 모두 입력해주세요');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('sub', uploadData.sub);
      formData.append('title', uploadData.title);
      formData.append('file', uploadFile);

      const res = await fetch('/api/create', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      alert('등록 완료!');
      setShowModal(false);
      setUploadData({ sub: '', title: '' });
      setUploadFile(null);
      fetchPosts();
    } catch (err) {
      alert('등록 실패: ' + err.message);
    } finally {
      setUploading(false);
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
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
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
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  // 뷰어 화면
  if (selectedPost) {
    return (
      <>
        <Head>
          <title>{selectedPost.title} - JSON Viewer</title>
        </Head>
        
        <div className="viewer-container">
          <div className="viewer-header">
            <h2>{selectedPost.title}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* 테마 선택 */}
              <select 
                value={theme} 
                onChange={(e) => setTheme(Number(e.target.value))}
                className="theme-select"
              >
                <option value={1}>테마 1 (기본)</option>
                <option value={2}>테마 2 (SNS)</option>
              </select>
              <button className="btn-back" onClick={closeViewer}>
                ← 목록
              </button>
            </div>
          </div>

          {viewerLoading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className="error">⚠️ {error}</div>
          )}

          {!viewerLoading && messages.length > 0 && (
            <div className={`chat-messages theme-${theme}`}>
              {messages.map((msg, index) => {
                const isUser = msg.is_user;
                const charName = msg.name || (isUser ? 'User' : 'AI');
                const content = msg.mes || msg.content || msg.message || msg.text || '';
                const timestamp = msg.send_date || '';
                const tokenCount = msg.extra?.token_count;

                if (!content) return null;

                // 테마 1: 기본 스타일
                if (theme === 1) {
                  return (
                    <div key={index} className="mes">
                      <div className="mesAvatarWrapper" style={{ 
                        flexDirection: isUser ? 'row-reverse' : 'row' 
                      }}>
                        <div className="mesIDDisplay">#{index}</div>
                        {tokenCount && (
                          <div className="tokenCounterDisplay">{tokenCount}t</div>
                        )}
                      </div>
                      
                      <div className="ch_name">
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="name_text">{charName}</span>
                          {timestamp && (
                            <small className="timestamp">{timestamp}</small>
                          )}
                        </div>
                      </div>
                      
                      <div 
                        className="mes_text"
                        dangerouslySetInnerHTML={{ __html: formatMessage(content) }}
                      />
                    </div>
                  );
                }

                // 테마 2: SNS 채팅 스타일
                return (
                  <div key={index} className={`sns-message ${isUser ? 'user' : 'ai'}`}>
                    <div className="sns-meta">
                      <span className="sns-name">{charName}</span>
                      {timestamp && <span className="sns-time">{timestamp}</span>}
                    </div>
                    <div 
                      className="sns-bubble"
                      dangerouslySetInnerHTML={{ __html: formatMessage(content) }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* 플로팅 버튼 */}
          <div className="floating-menu">
            <button className="floating-btn" onClick={closeViewer} title="목록으로">
              ←
            </button>
          </div>
        </div>
      </>
    );
  }

  // 게시판 화면
  return (
    <>
      <Head>
        <title>JSON Viewer</title>
      </Head>

      <div className="board-container">
        <div className="board-header">
          <h1>📄 JSON Viewer</h1>
          <p>노션 DB의 채팅 로그를 확인하세요</p>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="error">⚠️ {error}</div>
        )}

        {!loading && Object.keys(grouped).length === 0 && (
          <div className="empty-state">
            <div className="icon">📁</div>
            <p>등록된 게시글이 없습니다</p>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([folder, folderPosts]) => (
          <div key={folder} className="folder-section">
            <div 
              className="folder-header"
              onClick={() => toggleFolder(folder)}
            >
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

        {/* 플로팅 버튼들 */}
        <div className="floating-menu">
          <button 
            className="floating-btn add-btn" 
            onClick={() => setShowModal(true)}
            title="새 글 등록"
          >
            +
          </button>
          <button 
            className="floating-btn refresh-btn" 
            onClick={fetchPosts}
            title="새로고침"
          >
            🔄
          </button>
        </div>
      </div>

      {/* 등록 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>📝 새 글 등록</h3>
            
            <div className="form-group">
              <label>폴더 (sub)</label>
              <input 
                type="text"
                placeholder="예: 바론, 킬리언"
                value={uploadData.sub}
                onChange={(e) => setUploadData({...uploadData, sub: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>제목 (title)</label>
              <input 
                type="text"
                placeholder="게시글 제목"
                value={uploadData.title}
                onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>JSON 파일</label>
              <div 
                className="file-drop"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadFile ? (
                  <span>📄 {uploadFile.name}</span>
                ) : (
                  <span>클릭하여 파일 선택 (.json, .jsonl)</span>
                )}
                <input 
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.jsonl"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
            
            <div className="modal-buttons">
              <button 
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button 
                className="btn-submit"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
