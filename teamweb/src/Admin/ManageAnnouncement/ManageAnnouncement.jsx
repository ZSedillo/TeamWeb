import React, { useState, useEffect } from "react";
import AdminHeader from "../Component/AdminHeader.jsx";
import "./ManageAnnouncement.css";

function ManageAnnouncement() {
    const getToken = () => localStorage.getItem("token");
    const [announcements, setAnnouncements] = useState([]);
    const [newAnnouncement, setNewAnnouncement] = useState({ 
        title: "", 
        description: "", 
        image_url: null, 
        preview: null 
    });
    const [editingId, setEditingId] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false); // New state for confirm modal
    const [deleteId, setDeleteId] = useState(null);
    const [announcementTitle, setAnnouncementTitle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const announcementsPerPage = 6;
    const baseUrl = "https://teamweb-kera.onrender.com"; //http://localhost:3000
    const [username, setUsername] = useState("");

    useEffect(() => {
        const loggedInUser = localStorage.getItem('username');
        if (loggedInUser) {
          setUsername(loggedInUser);
        } else {
          setUsername("Admin");
        }
        fetchAnnouncements();
    }, []);
    
    const fetchAnnouncements = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${baseUrl}/announcement`);
            if (!response.ok) throw new Error("Failed to fetch announcements");
            const data = await response.json();
            // Sort announcements by created_at in descending order (newest first)
            const sortedAnnouncements = Array.isArray(data.announcements) 
                ? data.announcements.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) 
                : [];
            setAnnouncements(sortedAnnouncements);
        } catch (error) {
            console.error("Error fetching announcements:", error);
            setError("Failed to load announcements. Please try again later.");
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };
    
    // Show confirmation modal first instead of direct submission
    const handleSubmitForm = (event) => {
        event.preventDefault();
        
        // Validate inputs
        if (!newAnnouncement.title.trim() || !newAnnouncement.description.trim()) {
            alert("Title and description are required.");
            return;
        }
        
        // Show confirmation modal
        setShowConfirmModal(true);
    };
    
        const handleCreateOrUpdateAnnouncement = async () => {
        // Hide the confirmation modal
        setShowConfirmModal(false);

        const formData = new FormData();
        formData.append("title", newAnnouncement.title.trim());
        formData.append("description", newAnnouncement.description.trim());
        // Handle image based on whether it's a File object or string URL
        if (newAnnouncement.image_url instanceof File) {
            // It's a new file upload
            formData.append("image", newAnnouncement.image_url);
        } else if (typeof newAnnouncement.image_url === 'string' && newAnnouncement.image_url) {
            // It's an existing image - just send the existing URL or path
            formData.append("existing_image", newAnnouncement.image_url);
        }

        try {
            const url = editingId
                ? `${baseUrl}/announcement/edit/${editingId}`
                : `${baseUrl}/announcement/add`;
            const method = editingId ? "PUT" : "POST";

            const token = getToken();

            // Show loading state
            const submitBtn = document.querySelector('.submit-button');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = editingId ? "Updating..." : "Posting...";
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`, // ✅ Include token
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error response:", errorText);
                throw new Error("Failed to save announcement");
            }

            // ✅ Call the `/add-report` API with auth header and username
            const username = localStorage.getItem('username') || 'Unknown User';

            await fetch("https://teamweb-kera.onrender.com/report/add-report", {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`, // ✅ Include token
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    activityLog: editingId
                        ? `[Manage Announcement] Edited Announcement: ${newAnnouncement.title.trim()}`
                        : `[Manage Announcement] Added Announcement: ${newAnnouncement.title.trim()}`
                }),
            });

            resetForm();
            fetchAnnouncements();

            // Show success toast
            showToast(editingId ? "Announcement updated successfully!" : "Announcement posted successfully!");
        } catch (error) {
            console.error("Error submitting announcement:", error);
            alert(error.message || "Failed to save. Please try again.");
        } finally {
            // Reset button state
            const submitBtn = document.querySelector('.submit-button');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = editingId ? "Update Announcement" : "Post Announcement";
            }
        }
    };
    
    const resetForm = () => {
        setNewAnnouncement({ title: "", description: "", image_url: null, preview: null });
        setEditingId(null);
        setShowFormModal(false);
        setShowConfirmModal(false);
    };

    const handleDelete = async (announcement) => {
        try {
            const deleteBtn = document.querySelector('.delete-confirm-btn');
            if (deleteBtn) {
                deleteBtn.disabled = true;
                deleteBtn.textContent = "Deleting...";
            }

            const token = getToken();

            const response = await fetch(`${baseUrl}/announcement/delete/${deleteId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to delete announcement");
            }

            // ✅ Call `/add-report` API
            await fetch("https://teamweb-kera.onrender.com/report/add-report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    username: username, // Replace with actual username
                    activityLog: `[Manage Announcement] Deleted Announcement: ${announcementTitle}`
                }),
            });

            fetchAnnouncements();
            setShowDeleteModal(false);
            setDeleteId(null);
            setAnnouncementTitle(null);

            // Show success toast
            showToast("Announcement deleted successfully!");
        } catch (error) {
            console.error("Error deleting announcement:", error);
            alert(error.message || "Failed to delete. Please try again.");
        } finally {
            const deleteBtn = document.querySelector('.delete-confirm-btn');
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.textContent = "Yes, Delete";
            }
        }
    };
    
    const openDeleteModal = (id,title) => {
        setDeleteId(id);
        setAnnouncementTitle(title);
        setShowDeleteModal(true);
    };
    
    const handleEdit = (announcement) => {
        setEditingId(announcement._id);
        setNewAnnouncement({ 
            title: announcement.title, 
            description: announcement.description, 
            // Keep the original image URL string when editing
            image_url: announcement.image_url, 
            // Use the same URL that's working in your cards
            preview: announcement.image_url 
        });
        setShowFormModal(true);
    };
    const openAddModal = () => {
        resetForm();
        setShowFormModal(true);
    };
    
    const showToast = (message) => {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Show and then hide after 3 seconds
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 3000);
        }, 100);
    };

    // Pagination calculations
    const indexOfLastAnnouncement = pageNumber * announcementsPerPage;
    const indexOfFirstAnnouncement = indexOfLastAnnouncement - announcementsPerPage;
    const currentAnnouncements = announcements.slice(indexOfFirstAnnouncement, indexOfLastAnnouncement);
    const totalPages = Math.ceil(announcements.length / announcementsPerPage);

    const paginate = (pageNum) => setPageNumber(pageNum);

    const renderPagination = () => {
        if (totalPages <= 1) return null;
        
        return (
            <div className="pagination-manage-announcement">                
                {totalPages <= 5 ? (
                    // Show all pages if there are 5 or fewer
                    Array.from({ length: totalPages }, (_, i) => (
                        <button 
                            key={i + 1} 
                            className={`page-button-manage-announcement ${pageNumber === i + 1 ? "active" : ""}`} 
                            onClick={() => paginate(i + 1)}
                            aria-label={`Page ${i + 1}`}
                            aria-current={pageNumber === i + 1 ? 'page' : null}
                        >
                            {i + 1}
                        </button>
                    ))
                ) : (
                    // Logic for showing limited pages with ellipsis
                    <>
                        <button 
                            className={`page-button-manage-announcement ${pageNumber === 1 ? "active" : ""}`}
                            onClick={() => paginate(1)}
                            aria-label="Page 1"
                            aria-current={pageNumber === 1 ? 'page' : null}
                        >
                            1
                        </button>
                        
                        {pageNumber > 3 && <span className="page-ellipsis">...</span>}
                        
                        {pageNumber > 2 && pageNumber < totalPages && (
                            Array.from(
                                { length: Math.min(3, totalPages - 2) }, 
                                (_, i) => {
                                    let pageNum;
                                    if (pageNumber <= 2) pageNum = i + 2;
                                    else if (pageNumber >= totalPages - 1) pageNum = totalPages - 3 + i;
                                    else pageNum = pageNumber - 1 + i;
                                    
                                    // Don't render if it would show the first or last page (those are handled separately)
                                    if (pageNum === 1 || pageNum === totalPages) return null;
                                    
                                    return (
                                        <button 
                                            key={pageNum} 
                                            className={`page-button ${pageNumber === pageNum ? "active" : ""}`}
                                            onClick={() => paginate(pageNum)}
                                            aria-label={`Page ${pageNum}`}
                                            aria-current={pageNumber === pageNum ? 'page' : null}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                }
                            ).filter(Boolean)
                        )}
                        
                        {pageNumber < totalPages - 2 && <span className="page-ellipsis">...</span>}
                        
                        <button 
                            className={`page-button ${pageNumber === totalPages ? "active" : ""}`}
                            onClick={() => paginate(totalPages)}
                            aria-label={`Page ${totalPages}`}
                            aria-current={pageNumber === totalPages ? 'page' : null}
                        >
                            {totalPages}
                        </button>
                    </>
                )}
                
                <button 
                    className="page-nav" 
                    onClick={() => paginate(Math.min(totalPages, pageNumber + 1))}
                    disabled={pageNumber === totalPages}
                    aria-label="Next page"
                >
                    <i className="fa fa-chevron-right"></i>
                </button>
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
                <button 
                    className="add-post-btn"
                    onClick={openAddModal}
                    aria-label="Add new announcement"
                >
                    <i className="fa fa-plus-circle"></i> Create Post
                </button>
                <div className="format-info">All post types supported</div>
            </div>
            </div>

                {/* Announcement List Section */}
                <div className="announcement-list-section">
                    <div className="section-header">
                        <h3 className="section-title">Current Announcements</h3>
                        <div className="announcement-count">
                            {announcements.length} {announcements.length === 1 ? 'announcement' : 'announcements'}
                        </div>
                    </div>

                    {/* Loading and Error States */}
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
                            <button 
                                className="retry-btn"
                                onClick={fetchAnnouncements}
                            >
                                <i className="fa fa-refresh"></i> Retry
                            </button>
                        </div>
                    )}

                    {/* Announcement List */}
                    {!loading && !error && (
                        <>
                            <div className="announcements-grid">
                                {currentAnnouncements.length > 0 ? (
                                    currentAnnouncements.map((announcement) => {
                                        const imagePath = announcement.image_url
                                            ? `${baseUrl}/announcement/${announcement.image_url}`
                                            : null;
                                        const formattedDate = new Date(announcement.created_at).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        });

                                        return (
                                        <div key={announcement._id} className="announcement-card">
                                            <div className="card-image-container">
                                                {imagePath ? (
                                                    <img 
                                                        src={announcement.image_url} 
                                                        alt={announcement.title} 
                                                        className="card-image" 
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="no-image-placeholder">
                                                        <i className="fa fa-image"></i>
                                                        <p>No Image</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="card-content">
                                                <h4 className="card-title" title={announcement.title}>
                                                    {announcement.title}
                                                </h4>
                                                <p className="announcement-date">
                                                    <i className="fa fa-calendar"></i> {formattedDate}
                                                </p>
                                                <div className="card-description-container">
                                                    <p className="card-description">{announcement.description}</p>
                                                </div>
                                                <div className="card-actions">
                                                    <button 
                                                        onClick={() => handleEdit(announcement)} 
                                                        className="edit-btn"
                                                        aria-label={`Edit ${announcement.title}`}
                                                    >
                                                        <i className="fa fa-pencil"></i> Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => openDeleteModal(announcement._id,announcement.title)} 
                                                        className="delete-btn"
                                                        aria-label={`Delete ${announcement.title}`}
                                                    >
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
                                        <button 
                                            className="create-first-btn"
                                            onClick={openAddModal}
                                        >
                                            Create your first announcement
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {renderPagination()}
                        </>
                    )}
                </div>
            </div>

            {/* Create/Edit Announcement Modal */}
            {showFormModal && (
                <div className="modal-overlay" onClick={() => resetForm()}>
                    <div className="modal-container" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingId ? "Edit Announcement" : "Create New Announcement"}</h3>
                            <button className="modal-close" onClick={resetForm} aria-label="Close modal">
                                <i className="fa fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmitForm}>
                                <div className="form-group">
                                    <label htmlFor="announcement-title">Title <span className="required">*</span></label>
                                    <input
                                        id="announcement-title"
                                        type="text"
                                        placeholder="Enter announcement title"
                                        value={newAnnouncement.title}
                                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                                        maxLength={100}
                                        required
                                    />
                                    <small className="char-count">{newAnnouncement.title.length}/100 characters</small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="announcement-description">Description <span className="required">*</span></label>
                                    <textarea
                                        id="announcement-description"
                                        placeholder="Enter announcement details"
                                        value={newAnnouncement.description}
                                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, description: e.target.value }))}
                                        className="description-textarea"
                                        maxLength={500}
                                        required
                                    />
                                    <small className="char-count">{newAnnouncement.description.length}/500 characters</small>
                                </div>

                                <div className="form-group">
                                    <label>Image (Optional)</label>
                                    <div className="file-upload-container">
                                        <label className="custom-file-upload">
                                            <input 
                                                type="file" 
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        const file = e.target.files[0];
                                                        console.log("File selected:", file);
                                                        // Validate file type
                                                        if (!file.type.match('image.*')) {
                                                            alert('Please select an image file (JPEG, PNG, etc.)');
                                                            return;
                                                        }
                                                        // Validate file size (5MB limit)
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            alert('File size exceeds 5MB limit.');
                                                            return;
                                                        }
                                                        setNewAnnouncement(prev => {
                                                            const updatedState = { 
                                                                ...prev, 
                                                                image_url: file, 
                                                                preview: URL.createObjectURL(file) 
                                                            };
                                                            console.log("Updated state:", updatedState);
                                                            return updatedState;
                                                        });
                                                    }
                                                }} 
                                                accept="image/*" 
                                            />
                                            <i className="fa fa-cloud-upload"></i> Upload Image
                                        </label>
                                        <div className="file-info">
                                            <p>Recommended: JPEG or PNG, max 5MB</p>
                                        </div>
                                    </div>

                                    {newAnnouncement.preview && (
                                        <div className="image-preview-container">
                                            <p>Image preview:</p>
                                            <img 
                                                src={newAnnouncement.preview} 
                                                alt="Preview" 
                                                className="image-preview"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button type="submit" className="submit-button">
                                        <i className="fa fa-check-circle"></i> 
                                        {editingId ? "Review Changes" : "Review Announcement"}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={resetForm}
                                        className="cancel-button"
                                    >
                                        <i className="fa fa-times"></i> Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="modal-container confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header preview-header">
                            <div className="preview-header-title">
                                <i className="fa fa-eye"></i>
                                <h3>Preview {editingId ? "Changes" : "Announcement"}</h3>
                            </div>
                            <button 
                                className="modal-close" 
                                onClick={() => setShowConfirmModal(false)}
                                aria-label="Close modal"
                            >
                                <i className="fa fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body preview-body">
                            <div className="confirm-content">
                                <div className="preview-card">
                                    {newAnnouncement.preview && (
                                        <div className="preview-image-wrapper">
                                            <img 
                                                src={newAnnouncement.preview} 
                                                alt="Announcement" 
                                                className="preview-hero-image"
                                            />
                                        </div>
                                    )}
                                    
                                    <div className="preview-main-content">
                                        <div className="preview-section">
                                            <div className="preview-label">
                                                <i className="fa fa-header"></i>
                                                <span>Title</span>
                                            </div>
                                            <h2 className="preview-title">{newAnnouncement.title}</h2>
                                        </div>
                                        
                                        <div className="preview-section">
                                            <div className="preview-label">
                                                <i className="fa fa-align-left"></i>
                                                <span>Description</span>
                                            </div>
                                            <div className="preview-description-container">
                                                <p className="preview-description">{newAnnouncement.description}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="preview-status">
                                            <div className="preview-status-label">
                                                <i className="fa fa-clock-o"></i>
                                                <span>Status</span>
                                            </div>
                                            <div className="preview-status-badge">
                                                Ready to {editingId ? "Update" : "Post"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="preview-note">
                                    <i className="fa fa-info-circle"></i>
                                    <p>Please review your announcement carefully before proceeding. Once published, it will be immediately visible to all users.</p>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer preview-footer">
                            <button 
                                onClick={() => setShowConfirmModal(false)} 
                                className="preview-back-btn"
                            >
                                <i className="fa fa-pencil"></i> Edit
                            </button>
                            <button 
                                onClick={handleCreateOrUpdateAnnouncement} 
                                className="preview-confirm-btn"
                            >
                                <i className="fa fa-check-circle"></i> {editingId ? "Update" : "Publish"} Announcement
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-container delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Confirm Deletion</h3>
                            <button 
                                className="modal-close" 
                                onClick={() => setShowDeleteModal(false)}
                                aria-label="Close modal"
                            >
                                <i className="fa fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="delete-warning">
                                <i className="fa fa-exclamation-triangle"></i>
                                <p>Are you sure you want to delete this announcement?</p>
                                <p className="delete-note">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={handleDelete} className="delete-confirm-btn">
                                <i className="fa fa-trash"></i> Yes, Delete
                            </button>
                            <button 
                                onClick={() => setShowDeleteModal(false)} 
                                className="delete-cancel-btn"
                            >
                                <i className="fa fa-times"></i> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ManageAnnouncement;