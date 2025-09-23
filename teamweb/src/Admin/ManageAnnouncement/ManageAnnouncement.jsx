import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminHeader from "../Component/AdminHeader.jsx";
import "./ManageAnnouncement.css";
import DeleteModal from "./ManageAnnouncementModals/deleteModalAnnouncement.jsx";
import ShowFormModalAnnouncement from "./ManageAnnouncementModals/showFormModalAnnouncement.jsx";
import {
  fetchAnnouncements,
  addAnnouncement,
  editAnnouncement,
  deleteAnnouncement,
} from "../../_actions/announcement.actions";

function ManageAnnouncement() {
  const dispatch = useDispatch();
  const { announcements, loading, error } = useSelector((state) => state.announcementState);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    description: "",
    image_url: null,
    preview: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState(null);
  const announcementsPerPage = 6;
  const baseUrl = "https://teamweb-kera.onrender.com";
  const [username, setUsername] = useState("Admin");

  useEffect(() => {
    const loggedInUser = localStorage.getItem("username");
    if (loggedInUser) setUsername(loggedInUser);
    dispatch(fetchAnnouncements());
  }, [dispatch]);

  const handleCreateOrUpdateAnnouncement = async (data) => {
    const payload = {
      title: data.title || "",
      description: data.description || "",
      image_url: data.image_url || null,
    };

    if (editingId) await dispatch(editAnnouncement(editingId, payload, username));
    else await dispatch(addAnnouncement(payload, username));

    resetForm();
    showToast(editingId ? "Announcement updated successfully!" : "Announcement posted successfully!");
  };

  const handleDelete = async () => {
    await dispatch(deleteAnnouncement(deleteId, username, announcementTitle));
    setShowDeleteModal(false);
    setDeleteId(null);
    setAnnouncementTitle(null);
    showToast("Announcement deleted successfully!");
  };

  const resetForm = () => {
    setNewAnnouncement({ title: "", description: "", image_url: null, preview: null });
    setEditingId(null);
    setShowFormModal(false);
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement._id);
    setNewAnnouncement({
      title: announcement.title,
      description: announcement.description,
      image_url: announcement.image_url,
      preview: announcement.image_url,
    });
    setShowFormModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openDeleteModal = (id, title) => {
    setDeleteId(id);
    setAnnouncementTitle(title);
    setShowDeleteModal(true);
  };

  const showToast = (message) => {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    }, 100);
  };

  // Pagination
  const indexOfLastAnnouncement = pageNumber * announcementsPerPage;
  const indexOfFirstAnnouncement = indexOfLastAnnouncement - announcementsPerPage;
  const currentAnnouncements = announcements.slice(indexOfFirstAnnouncement, indexOfLastAnnouncement);
  const totalPages = Math.ceil(announcements.length / announcementsPerPage);
  const paginate = (pageNum) => setPageNumber(pageNum);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="pagination-manage-announcement">
        {totalPages <= 5
          ? Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`page-button-manage-announcement ${pageNumber === i + 1 ? "active" : ""}`}
                onClick={() => paginate(i + 1)}
                aria-label={`Page ${i + 1}`}
                aria-current={pageNumber === i + 1 ? "page" : null}
              >
                {i + 1}
              </button>
            ))
          : <>
              <button
                className={`page-button-manage-announcement ${pageNumber === 1 ? "active" : ""}`}
                onClick={() => paginate(1)}
              >1</button>
              {pageNumber > 3 && <span className="page-ellipsis">...</span>}
              {pageNumber > 2 && pageNumber < totalPages && (
                Array.from({ length: Math.min(3, totalPages - 2) }, (_, i) => {
                  let pageNum;
                  if (pageNumber <= 2) pageNum = i + 2;
                  else if (pageNumber >= totalPages - 1) pageNum = totalPages - 3 + i;
                  else pageNum = pageNumber - 1 + i;
                  if (pageNum === 1 || pageNum === totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      className={`page-button ${pageNumber === pageNum ? "active" : ""}`}
                      onClick={() => paginate(pageNum)}
                    >{pageNum}</button>
                  );
                }).filter(Boolean)
              )}
              {pageNumber < totalPages - 2 && <span className="page-ellipsis">...</span>}
              <button
                className={`page-button ${pageNumber === totalPages ? "active" : ""}`}
                onClick={() => paginate(totalPages)}
              >{totalPages}</button>
            </>
        }
        <button
          className="page-nav"
          onClick={() => paginate(Math.min(totalPages, pageNumber + 1))}
          disabled={pageNumber === totalPages}
        ><i className="fa fa-chevron-right"></i></button>
      </div>
    );
  };

  return (
    <>
      <AdminHeader />
      <div className="content-container">
        <div className="page-header">
          <h1>School Announcement Management</h1>
          <p>Manage school announcements and communications</p>
        </div>
      </div>

      <div className="admin-container">
        <div className="announcement-header">
          <div className="header-flex">
            <div className="upload-label">Add New Post</div>
            <button className="add-post-btn" onClick={openAddModal} aria-label="Add new announcement">
              <i className="fa fa-plus-circle"></i> Create Post
            </button>
            <div className="format-info">All post types supported</div>
          </div>
        </div>

        {/* Loading & Error */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading announcements...</p>
          </div>
        )}
        {error && !loading && (
          <div className="error-container">
            <i className="fa fa-exclamation-circle"></i>
            <p>{error}</p>
            <button className="retry-btn" onClick={() => dispatch(fetchAnnouncements())}>
              <i className="fa fa-refresh"></i> Retry
            </button>
          </div>
        )}

        {/* Announcements */}
        {!loading && !error && (
          <>
            <div className="announcements-grid">
              {currentAnnouncements.length > 0 ? (
                currentAnnouncements.map((announcement) => {
                  const imagePath = announcement.image_url
                    ? `${baseUrl}/announcement/${announcement.image_url}`
                    : null;
                  const formattedDate = new Date(announcement.created_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric'
                  });
                  return (
                    <div key={announcement._id} className="announcement-card">
                      <div className="card-image-container">
                        {imagePath ? (
                          <img src={announcement.image_url} alt={announcement.title} className="card-image" loading="lazy" />
                        ) : (
                          <div className="no-image-placeholder">
                            <i className="fa fa-image"></i>
                            <p>No Image</p>
                          </div>
                        )}
                      </div>
                      <div className="card-content">
                        <h4 className="card-title" title={announcement.title}>{announcement.title}</h4>
                        <p className="announcement-date"><i className="fa fa-calendar"></i> {formattedDate}</p>
                        <div className="card-description-container">
                          <p className="card-description">{announcement.description}</p>
                        </div>
                        <div className="card-actions">
                          <button onClick={() => handleEdit(announcement)} className="edit-btn">
                            <i className="fa fa-pencil"></i> Edit
                          </button>
                          <button onClick={() => openDeleteModal(announcement._id, announcement.title)} className="delete-btn">
                            <i className="fa fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-announcements">
                  <i className="fa fa-info-circle"></i>
                  <p>No announcements available.</p>
                  <button className="create-first-btn" onClick={openAddModal}>
                    Create your first announcement
                  </button>
                </div>
              )}
            </div>
            {renderPagination()}
          </>
        )}
      </div>

      <ShowFormModalAnnouncement
        isOpen={showFormModal}
        onClose={resetForm}
        onSubmit={handleCreateOrUpdateAnnouncement}
        editingId={editingId}
        initialData={newAnnouncement}
      />

      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          announcementTitle={announcementTitle}
        />
      )}
    </>
  );
}

export default ManageAnnouncement;
