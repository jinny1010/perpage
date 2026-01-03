export default function ImageViewer({ bookmark, onClose }) {
  if (!bookmark) return null;

  // 텍스트 포맷 처리 (HTML 태그 유지 + 마크다운 변환)
  const formatText = (text) => {
    if (!text) return '';
    
    let formatted = text;
    
    // 마크다운 이탤릭 (*텍스트* 또는 _텍스트_) - 이미 <em>이 아닌 경우만
    formatted = formatted.replace(/(?<!<)\*([^*<>]+)\*(?!>)/g, '<em>$1</em>');
    formatted = formatted.replace(/(?<!<)_([^_<>]+)_(?!>)/g, '<em>$1</em>');
    
    // 마크다운 볼드 (**텍스트**)
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // 줄바꿈 처리 (HTML에 이미 <br>이 없으면)
    if (!formatted.includes('<br') && !formatted.includes('<p>')) {
      formatted = formatted.replace(/\n/g, '<br/>');
    }
    
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
