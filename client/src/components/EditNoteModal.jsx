// src/components/EditNoteModal.jsx
import React from "react";
import { FiX } from "react-icons/fi";

const EditNoteModal = React.memo(
  ({ formData, onChange, onClose, onSubmit, categories }) => {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal glass-card fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 className="text-xl font-bold">Edit Note</h2>
            <button
              type="button"
              onClick={onClose}
              className="mobile-menu-button"
            >
              <FiX />
            </button>
          </div>

          <form onSubmit={onSubmit} className="modal-content">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-note-title">
                Title
              </label>
              <input
                id="edit-note-title"
                name="title"
                type="text"
                required
                className="glass-input"
                value={formData.title}
                onChange={onChange}
                placeholder="Note title"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-note-category">
                Category
              </label>
              <select
                id="edit-note-category"
                name="categoryId"
                className="glass-input"
                value={formData.categoryId}
                onChange={onChange}
              >
                <option value="">-- Select Category --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-note-content">
                Content
              </label>
              <textarea
                id="edit-note-content"
                name="content"
                required
                className="glass-input"
                value={formData.content}
                onChange={onChange}
                placeholder="Write your note here..."
                style={{ minHeight: "200px", resize: "vertical" }}
                autoComplete="off"
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="liquid-button">
                Update Note
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

export default EditNoteModal;
