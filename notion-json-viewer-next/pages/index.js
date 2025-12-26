import { useState, useEffect } from 'react';
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

  // 메시지 포맷팅 (standalone 로직)
  const formatMessage = (content) => {
    if (!content) return '';
    
    // OOC 처리
    content = content.replace(/\(??[Oo][Oo][Cc]\s*:[\s\S]*$/gm, (match) => {
      return `<details><summary>OOC Hidden</summary>${match}</details>`;
    });

    // thinking 태그 제거
    content = content.replace(/(?:```?\w*[\r\n]?)?<(thought|cot|thinking|CoT|think|starter)[\s\S]*?<\/(thought|cot|thinking|CoT|think|starter)>(?:[\r\n]?```?)?/g, '');

    // imageinfo 제거
    content = content.replace(/<[Ii][Mm][Aa][Gg][Ee][Ii][Nn][Ff][Oo]>[\s\S]*?<\/[Ii][Mm][Aa][Gg][Ee][Ii][Nn][Ff][Oo]>/g, '');
    
    // pic 태그 제거
    content = content.replace(/<pic\s+prompt="[^"]*"\s*\/?>[\s\S]*?(?:<\/pic>)?/g, '');
    content = content.replace(/<pic>[\s\S]*?<\/pic>/g, '');
    content = content.replace(/<\/pic>/g, '');
    
    // infoblock 제거
    content = content.replace(/<infoblock>[\s\S]*?<\/infoblock>/g, '');

    // HTML 이스케이프
    const escapeHtml = (text) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    // 코드 블록 보존
    const codeBlocks = [];
    content = content.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      codeBlocks.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
      return `___CODEBLOCK_${codeBlocks.length - 1}___`;
    });

    // 인라인 코드
    const inlineCodes = [];
    content = content.replace(/`([^`]+)`/g, (match, code) => {
      inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
      return `___INLINE_${inlineCodes.length - 1}___`;
    });

    // 마크다운 변환
    content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.+?)\*/g, '<em>$1</em>');
    content = content.replace(/_(.+?)_/g, '<em>$1</em>');

    // 인용문
    content = content.replace(/"([^"]+)"/g, '<q>"$1"</q>');

    // 코드 복원
    codeBlocks.forEach((block, i) => {
      content = content.replace(`___CODEBLOCK_${i}___`, block);
    });
    inlineCodes.forEach((code, i) => {
      content = content.replace(`___INLINE_${i}___`, code);
    });

    // 줄바꿈
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
            <button className="btn-back" onClick={closeViewer}>
              ← 목록으로
            </button>
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
            <div className="chat-messages">
              {messages.map((msg, index) => {
                const isUser = msg.is_user;
                const charName = msg.name || (isUser ? 'User' : 'AI');
                const content = msg.mes || msg.content || msg.message || msg.text || '';
                const timestamp = msg.send_date || '';
                const tokenCount = msg.extra?.token_count;

                if (!content) return null;

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

        {/* 플로팅 새로고침 버튼 */}
        <div className="floating-menu">
          <button 
            className="floating-btn" 
            onClick={fetchPosts}
            title="새로고침"
          >
            🔄
          </button>
        </div>
      </div>
    </>
  );
}
