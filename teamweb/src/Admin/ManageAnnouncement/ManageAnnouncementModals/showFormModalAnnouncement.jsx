import React, { useState, useEffect } from "react";

function ShowFormModalAnnouncement({ 
    isOpen, 
    onClose, 
    onSubmit, 
    editingId = null, 
    initialData = { title: "", description: "", image_url: null, preview: null } 
}) {
    const [formData, setFormData] = useState(initialData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update form data when initialData changes (for editing)
    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({ title: "", description: "", image_url: null, preview: null });
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Validate inputs
        if (!formData.title.trim() || !formData.description.trim()) {
            alert("Title and description are required.");
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Call the parent's submit function and wait for result
            const result = await onSubmit(formData);
            
            if (result && result.success) {
                // Close modal on successful submission
                onClose();
            } else if (result && result.error) {
                // Show error message if submission failed
                alert(result.error);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e) => {
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
            
            setFormData(prev => {
                const updatedState = { 
                    ...prev, 
                    image_url: file, 
                    preview: URL.createObjectURL(file) 
                };
                console.log("Updated state:", updatedState);
                return updatedState;
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{editingId ? "Edit Announcement" : "Create New Announcement"}</h3>
                    <button className="modal-close" onClick={onClose} aria-label="Close modal">
                        <i className="fa fa-times"></i>
                    </button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="announcement-title">Title <span className="required">*</span></label>
                            <input
                                id="announcement-title"
                                type="text"
                                placeholder="Enter announcement title"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                maxLength={100}
                                required
                                disabled={isSubmitting}
                            />
                            <small className="char-count">{formData.title.length}/100 characters</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="announcement-description">Description <span className="required">*</span></label>
                            <textarea
                                id="announcement-description"
                                placeholder="Enter announcement details"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className="description-textarea"
                                maxLength={500}
                                required
                                disabled={isSubmitting}
                            />
                            <small className="char-count">{formData.description.length}/500 characters</small>
                        </div>

                        <div className="form-group">
                            <label>Image (Optional)</label>
                            <div className="file-upload-container">
                                <label className="custom-file-upload">
                                    <input 
                                        type="file" 
                                        onChange={handleFileChange}
                                        accept="image/*" 
                                        disabled={isSubmitting}
                                    />
                                    <i className="fa fa-cloud-upload"></i> Upload Image
                                </label>
                                <div className="file-info">
                                    <p>Recommended: JPEG or PNG, max 5MB</p>
                                </div>
                            </div>

                            {formData.preview && (
                                <div className="image-preview-container">
                                    <p>Image preview:</p>
                                    <img 
                                        src={formData.preview} 
                                        alt="Preview" 
                                        className="image-preview"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button 
                                type="submit" 
                                className="submit-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <i className="fa fa-spinner fa-spin"></i> 
                                        {editingId ? "Updating..." : "Posting..."}
                                    </>
                                ) : (
                                    <>
                                        <i className="fa fa-check-circle"></i> 
                                        {editingId ? "Update Announcement" : "Post Announcement"}
                                    </>
                                )}
                            </button>
                            <button 
                                type="button"
                                onClick={onClose}
                                className="cancel-button"
                                disabled={isSubmitting}
                            >
                                <i className="fa fa-times"></i> Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ShowFormModalAnnouncement;