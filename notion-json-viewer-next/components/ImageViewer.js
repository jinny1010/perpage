export default function ImageViewer({ bookmark, onClose }) {
  if (!bookmark) return null;

  console.log('ImageViewer bookmark:', bookmark);

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <button className="image-viewer-close" onClick={onClose}>✕</button>
      <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
        {bookmark.imageUrl ? (
          <img 
            src={bookmark.imageUrl} 
            alt="bookmark"
            className="image-viewer-img"
          />
        ) : (
          <div className="image-viewer-no-image">
            <p className="image-viewer-text">{bookmark.text}</p>
            {bookmark.sourceTitle && (
              <small className="image-viewer-source">{bookmark.sourceTitle}</small>
            )}
          </div>
        )}
        
        {bookmark.imageUrl && (
          <div className="image-viewer-caption">
            <p>{bookmark.text}</p>
            {bookmark.sourceTitle && <small>{bookmark.sourceTitle}</small>}
          </div>
        )}
      </div>
    </div>
  );
}
