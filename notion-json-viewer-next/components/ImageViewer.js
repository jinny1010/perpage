export default function ImageViewer({ bookmark, onClose }) {
  if (!bookmark) return null;

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <button className="image-viewer-close" onClick={onClose}>✕</button>
      <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
        <div 
          className="image-viewer-card"
          style={{
            backgroundImage: bookmark.imageUrl 
              ? `url(${bookmark.imageUrl})` 
              : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          }}
        >
          {/* 어두운 오버레이 */}
          <div className="image-viewer-dark-overlay" />
          
          {/* 텍스트 */}
          <div className="image-viewer-text-content">
            <p className="image-viewer-main-text">{bookmark.text}</p>
            {bookmark.sourceTitle && (
              <div className="image-viewer-source-info">
                <span className="image-viewer-source-title">{bookmark.sourceTitle}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
