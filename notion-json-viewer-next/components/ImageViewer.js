export default function ImageViewer({ bookmark, onClose }) {
  if (!bookmark) return null;

  // 마크다운 포맷 처리
  const formatText = (text) => {
    if (!text) return '';
    
    // 이탤릭 처리 (*텍스트* 또는 _텍스트_)
    let formatted = text
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // 볼드 처리 (**텍스트**)
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // 줄바꿈 처리
    formatted = formatted.replace(/\n/g, '<br/>');
    
    return formatted;
  };

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <button className="image-viewer-close" onClick={onClose}>✕</button>
      
      <div className="image-viewer-card" onClick={(e) => e.stopPropagation()}>
        {bookmark.imageUrl && (
          <img 
            src={bookmark.imageUrl} 
            alt="bookmark"
            className="image-viewer-bg"
          />
        )}
        
        <div className="image-viewer-text-overlay">
          <p 
            className="image-viewer-text"
            dangerouslySetInnerHTML={{ __html: formatText(bookmark.text) }}
          />
          {bookmark.sourceTitle && (
            <small className="image-viewer-source">{bookmark.sourceTitle}</small>
          )}
        </div>
      </div>
    </div>
  );
}
