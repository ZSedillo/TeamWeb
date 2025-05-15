import React, { useState, useEffect } from "react";
import AdminHeader from "./Component/AdminHeader.jsx";
import "./Homepage.css";

function Homepage() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [username, setUsername] = useState("");
  const [showImageConfirm, setShowImageConfirm] = useState(false);


  // NEW STATE FOR DESCRIPTION
  const [imageDescription, setImageDescription] = useState("");

  useEffect(() => {
    const loggedInUser = localStorage.getItem("username");
    setUsername(loggedInUser || "Admin");
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch("https://teamweb-kera.onrender.com/homepage/images");
      if (!response.ok) throw new Error("Failed to fetch images");
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview URL
    const previewURL = URL.createObjectURL(file);
    setPreviewImage(previewURL);
    // Reset description when a new image is selected
    setImageDescription("");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("image", selectedFile);
    
    // NEW: Add description to form data
    formData.append("description", imageDescription || "");

    try {
      // Simulate upload progress
      const uploadTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(uploadTimer);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(
        "https://teamweb-kera.onrender.com/homepage/upload-image",
        {
          method: "POST",
          body: formData,
        }
      );

      clearInterval(uploadTimer);
      setUploadProgress(100);

      if (response.ok) {
        fetchImages(); // Refresh images after upload

        await fetch("https://teamweb-kera.onrender.com/report/add-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            activityLog: `[Manage Homepage] Uploaded an Image: ${selectedFile.name}`,
          }),
        });
      }

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setPreviewImage(null);
        setSelectedFile(null);
        setImageDescription("");
      }, 500);
    } catch (error) {
      setIsUploading(false);
      console.error("Error uploading image:", error);
    }
  };

  const cancelUpload = () => {
    setPreviewImage(null);
    setSelectedFile(null);
  };

  const confirmDelete = (image) => {
    setSelectedImage(image);
    setShowDeleteConfirm(true);
  };

const handleDelete = async () => {
  if (!selectedImage) return;

  // Log what you're deleting
  console.log("Trying to delete:", selectedImage.image_url);
  console.log("Trying to delete:", selectedImage._id);

  const imageKey = selectedImage.image_url.replace("https://teamweb-image.s3.ap-southeast-1.amazonaws.com/", "");

  try {
    const response = await fetch(`https://teamweb-kera.onrender.com/homepage/delete-image/${encodeURIComponent(imageKey)}`, {
      method: "DELETE",
    });

    console.log("Delete response:", response.status);

    if (response.ok) {
      fetchImages();
      setShowDeleteConfirm(false);
      setSelectedImage(null);

      await fetch("https://teamweb-kera.onrender.com/report/add-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          activityLog: `[Manage Homepage] Deleted Image: ${selectedImage.image_url}`,
        }),
      });
    } else {
      console.error("Failed to delete image:", await response.text());
    }
  } catch (error) {
    console.error("Error deleting image:", error);
  }
};


 return (
    <>
      <AdminHeader />
      <div className="content-container">
        <div className="page-header">
          <h1>Manage Latest News</h1>
          <p>Manage the images that appear in the news section</p>
        </div>
      </div>
      <div className="admin-container">
        {/* Upload Section */}
        <div className="upload-card">
          <div className="upload-header">
            <h3>Upload New Image</h3>
            <p>Accepted formats: JPG, PNG, GIF (Max: 5MB)</p>
          </div>

          {isUploading ? (
            <div className="upload-progress-container">
              <div
                className="upload-progress-bar"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <span className="upload-progress-text">{uploadProgress}%</span>
            </div>
          ) : previewImage ? (
            <div className="image-preview-container">
              <div className="preview-wrapper">
                <img src={previewImage} alt="Preview" className="image-preview" />
              </div>
              
              {/* NEW: Description Input */}
              <div className="form-group" style={{ margin: '15px 0' }}>
                <label htmlFor="image-description">Image Description (Optional)</label>
                <textarea
                  id="image-description"
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                  placeholder="Enter a description for this image"
                  style={{
                    width: '100%', 
                    padding: '10px', 
                    minHeight: '100px', 
                    marginTop: '10px'
                  }}
                  maxLength={300}
                />
                <small>{imageDescription.length}/300 characters</small>
              </div>
              
              <div className="preview-actions">
              <button onClick={() => setShowImageConfirm(true)} className="post-btn">
                <span className="post-icon">✓</span> Post Image
               </button> {/* show the modal instead of immediately uploading */}
                <button onClick={cancelUpload} className="cancel-upload-btn">
                  <span className="cancel-icon">✕</span> Cancel
                </button>
              </div>
            </div>
          ) : (
            <label className="custom-file-upload">
              <input type="file" accept="image/*" onChange={handleFileSelect} />
              <span className="upload-icon">📷</span> Choose Image
            </label>
          )}
        </div>

        {/* Image List Grid */}
        <div className="images-container">
          <h3 className="section-title">Current Images ({images.length})</h3>

          {images.length === 0 ? (
            <div className="no-images">
              <p>No images uploaded yet. Add your first image to get started.</p>
            </div>
          ) : (
            <div className="image-list">
              {images.map((img) => {
                return (
                  <div key={img._id} className="image-box">
                    <div className="image-container">
                      <img src={img.image_url} alt="News" className="preview-image" />
                    </div>
                    <div className="image-info">
                      <span className="image-filename">{img.image_url}</span>
                      {/* NEW: Display description if available */}
                      {img.description && (
                        <div className="image-description" style={{
                          marginTop: '10px', 
                          fontSize: '0.9em', 
                          color: '#666',
                          maxHeight: '100px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {img.description}
                        </div>
                      )}
                      <button onClick={() => confirmDelete(img)} className="delete-btn">
                        <span className="delete-icon">🗑</span> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {showImageConfirm && (
  <div className="modal-overlay" onClick={() => setShowImageConfirm(false)}>
    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>Confirm Post</h3>
        <button
          className="modal-close"
          onClick={() => setShowImageConfirm(false)}
          aria-label="Close modal"
        >
          <i className="fa fa-times"></i>
        </button>
      </div>
      <div className="modal-body">
        <p>Are you sure you want to post this image to the homepage news section?</p>
      </div>
      <div className="modal-footer">
        <button
          onClick={(e) => {
            setShowImageConfirm(false);
            handleUpload(e);
          }}
          className="delete-confirm-btn"
        >
          <i className="fa fa-check"></i> Yes
        </button>
        <button
          onClick={() => setShowImageConfirm(false)}
          className="delete-cancel-btn"
        >
          <i className="fa fa-times"></i> No
        </button>
      </div>
    </div>
  </div>
)}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop">
          <div className="delete-modal">
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="close-modal" onClick={() => setShowDeleteConfirm(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this image?</p>
              {selectedImage && (
                <div className="confirm-image-preview">
                  <img
                    src={selectedImage.image_url}
                    alt="To be deleted"
                    className="confirm-preview"
                  />
                </div>
              )}
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="confirm-delete-btn" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Homepage;
