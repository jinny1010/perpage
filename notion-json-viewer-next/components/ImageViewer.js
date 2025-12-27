export default function ImageViewer({ bookmark, onClose }) {
  if (!bookmark) return null;

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <button className="image-viewer-close" onClick={onClose}>✕</button>
      <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
        <div 
          className="image-viewer-image"
          style={{
            backgroundImage: bookmark.imageUrl 
              ? `url(${bookmark.imageUrl})` 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <div className="image-viewer-text-overlay">
            <p className="image-viewer-text">{bookmark.text}</p>
            {bookmark.sourceTitle && (
              <small className="image-viewer-source">{bookmark.sourceTitle}</small>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
