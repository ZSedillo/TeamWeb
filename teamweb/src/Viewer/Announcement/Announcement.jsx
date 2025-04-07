import Header from "../Component/Header.jsx";
import Footer from "../Component/Footer.jsx";
import React, { useState, useEffect } from "react";
import "./Announcement.css";

function Announcement() {
    const [announcements, setAnnouncements] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Add loading state
    const announcementsPerPage = 5; // Show 5 announcements per page

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setIsLoading(true); // Set loading to true when fetch begins
        try {
            const response = await fetch("https://teamweb-kera.onrender.com/announcement");
            if (!response.ok) throw new Error("Failed to fetch announcements");
    
            const data = await response.json();
            console.log("Fetched announcements:", data); // Check API response
    
            if (data.announcements && Array.isArray(data.announcements)) {
                setAnnouncements(data.announcements); // ✅ Correct key
                console.log("State updated with:", data.announcements); // Check if state updates
            } else {
                console.error("Invalid data format:", data);
            }
        } catch (error) {
            console.error("Error fetching announcements:", error);
        } finally {
            setIsLoading(false); // Set loading to false when fetch completes (success or error)
        }
    };

    // Calculate pagination
    const indexOfLastAnnouncement = currentPage * announcementsPerPage;
    const indexOfFirstAnnouncement = indexOfLastAnnouncement - announcementsPerPage;
    
    // Get current page's announcements
    const currentAnnouncements = announcements.slice(indexOfFirstAnnouncement, indexOfLastAnnouncement);
    const totalPages = Math.ceil(announcements.length / announcementsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const openPopup = (announcement) => {
        setSelectedAnnouncement(announcement);
        setIsPopupOpen(true);
        // Prevent background scrolling when popup is open
        document.body.style.overflow = 'hidden';
    };

    const closePopup = () => {
        setIsPopupOpen(false);
        // Add a small delay before removing the selected announcement
        // to allow for a smoother transition if you want to add animations
        setTimeout(() => {
            setSelectedAnnouncement(null);
        }, 300);
        // Restore scrolling when popup is closed
        document.body.style.overflow = 'auto';
    };

    // Format date function
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isTruncated = (text) => {
        return text.length > 150;
    };

    return (
        <>
            <Header />
            <div className="announcement-main-container">
                <br />
                <br />
                <div className="announcements-list">
                    {isLoading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Loading announcements...</p>
                        </div>
                    ) : currentAnnouncements.length > 0 ? (
                        currentAnnouncements.map((announcement, index) => {
                            const imagePath = announcement.image_url 
                                ? `${announcement.image_url}` 
                                : null;
                            console.log("Rendering image from:", imagePath);

                            return (
                                <div 
                                    key={announcement._id} 
                                    className="announcement-card"
                                    onClick={() => openPopup(announcement)}
                                >
                                    {imagePath && (
                                        <div className="announcement-image-container">
                                            <img 
                                                src={imagePath} 
                                                alt={announcement.title} 
                                                className="announcement-image"
                                            />
                                        </div>
                                    )}
                                    <div className="announcement-content">
                                        <span className="announcement-number">
                                            {/* ANNOUNCEMENT #{indexOfFirstAnnouncement + index + 1} */}
                                        </span>
                                        <h3>{announcement.title}</h3>
                                        <p className={`announcement-preview ${isTruncated(announcement.description) ? 'truncated' : ''}`} 
                                        style={{ whiteSpace: "pre-line" }}>
                                            {announcement.description.length > 150 
                                                ? `${announcement.description.substring(0, 150)}...` 
                                                : announcement.description}
                                        </p>
                                        {isTruncated(announcement.description) && (
                                            <div className="read-more">Click to read full announcement</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="no-announcements">No announcements available.</p>
                    )}
                </div>

                {/* Enhanced Popup for full announcement */}
                {isPopupOpen && selectedAnnouncement && (
                    <div className="announcement-popup-overlay" onClick={closePopup}>
                        <div className="announcement-popup" onClick={(e) => e.stopPropagation()}>
                            <button className="close-popup" onClick={closePopup}>✕</button>
                            {selectedAnnouncement.image_url && (
                                <div className="popup-image-container">
                                    <img 
                                        src={selectedAnnouncement.image_url} 
                                        alt={selectedAnnouncement.title} 
                                        className="popup-image"
                                    />
                                </div>
                            )}
                            <div className="popup-content">
                                <h2 className="popup-title">{selectedAnnouncement.title}</h2>
                                <div className="popup-date">
                                    {formatDate(selectedAnnouncement.date || selectedAnnouncement.createdAt)}
                                </div>
                                <p className="popup-description" style={{ whiteSpace: "pre-line" }}>
                                    {selectedAnnouncement.description}
                                </p>
                                                                
                                {/* Display any additional fields if available */}
                                {selectedAnnouncement.content && (
                                    <div className="popup-full-content" 
                                         dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }}>
                                    </div>
                                )}
                                
                                {/* Additional metadata if available */}
                                {selectedAnnouncement.author && (
                                    <div className="popup-metadata">
                                        <p><strong>Posted by:</strong> {selectedAnnouncement.author}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Pagination - only show when not loading and we have pages */}
                {!isLoading && totalPages > 1 && (
                    <div className="pagination-container-announcement">
                        <div className="pagination-announcement">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    className={`page-button-announcement ${currentPage === i + 1 ? 'active' : ''}`}
                                    onClick={() => paginate(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <Footer className="announcement-footer" />
        </>
    );
}

export default Announcement;