import { useEffect } from 'react';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal d-block modal-shade" tabIndex="-1" onMouseDown={onClose}>
      <div className="modal-dialog modal-dialog-centered" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-content" role="dialog" aria-label={title}>
          <div className="modal-header">
            <h2 className="modal-title fs-5 m-0">{title}</h2>
            <button type="button" className="btn-close" aria-label="Закрити" onClick={onClose} />
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}
