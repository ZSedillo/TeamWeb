import React from "react";
import "./deleteModalAnnouncement.css";

function DeleteModalAnnouncement({ isOpen, onClose, onConfirm, announcementTitle }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container delete-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Confirm Deletion</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <i className="fa fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="delete-warning">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Are you sure you want to delete "{announcementTitle}"?</p>
            <p className="delete-note">This action cannot be undone.</p>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onConfirm} className="delete-confirm-btn">
            <i className="fa fa-trash"></i> Yes, Delete
          </button>
          <button onClick={onClose} className="delete-cancel-btn">
            <i className="fa fa-times"></i> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteModalAnnouncement;
