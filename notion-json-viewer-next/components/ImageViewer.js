export default function ImageViewer({ bookmark, onClose }) {
  if (!bookmark) return null;

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <button className="image-viewer-close" onClick={onClose}>✕</button>
      
      {bookmark.imageUrl ? (
        <img 
          src={bookmark.imageUrl} 
          alt="bookmark"
          className="image-viewer-fullscreen"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="image-viewer-text-only" onClick={(e) => e.stopPropagation()}>
          <p>{bookmark.text}</p>
          {bookmark.sourceTitle && <small>{bookmark.sourceTitle}</small>}
        </div>
      )}
    </div>
  );
}
