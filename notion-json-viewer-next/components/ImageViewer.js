export default function ImageViewer({ bookmark, onClose }) {
  if (!bookmark) return null;

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
          <p className="image-viewer-text">{bookmark.text}</p>
          {bookmark.sourceTitle && (
            <small className="image-viewer-source">{bookmark.sourceTitle}</small>
          )}
        </div>
      </div>
    </div>
  );
}
