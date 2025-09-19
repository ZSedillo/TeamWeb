import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../Component/Header.jsx";
import Footer from "../Component/Footer.jsx";
import { fetchAnnouncements } from "../../_actions/announcement.actions.js";
import { useEffect } from "react";
import "./Announcement.css";

function Announcement() {
    const dispatch = useDispatch();

    // Redux state
    const { announcements, loading, error } = useSelector(
        (state) => state.announcementState
    );

    // Local UI state
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const announcementsPerPage = 5;

    // Fetch announcements on mount
    useEffect(() => {
        dispatch(fetchAnnouncements());
    }, [dispatch]);

    // Pagination calculations
    const indexOfLastAnnouncement = currentPage * announcementsPerPage;
    const indexOfFirstAnnouncement = indexOfLastAnnouncement - announcementsPerPage;
    const currentAnnouncements = announcements.slice(
        indexOfFirstAnnouncement,
        indexOfLastAnnouncement
    );
    const totalPages = Math.ceil(announcements.length / announcementsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Popup handlers
    const openPopup = (announcement) => {
        setSelectedAnnouncement(announcement);
        setIsPopupOpen(true);
        document.body.style.overflow = "hidden"; // prevent background scroll
    };

    const closePopup = () => {
        setIsPopupOpen(false);
        setTimeout(() => setSelectedAnnouncement(null), 300);
        document.body.style.overflow = "auto";
    };

    // Utility functions
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const isTruncated = (text) => text.length > 150;

    return (
        <>
            <Header />
            <div className="announcement-main-container">
                <br /><br />

                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading announcements...</p>
                    </div>
                ) : error ? (
                    <p className="error-message">Error: {error}</p>
                ) : currentAnnouncements.length === 0 ? (
                    <p className="no-announcements">No announcements available.</p>
                ) : (
                    <div className="announcements-list">
                        {currentAnnouncements.map((announcement, index) => {
                            const imagePath = announcement.image_url || null;
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
                                        <h3>{announcement.title}</h3>
                                        <p
                                            className={`announcement-preview ${
                                                isTruncated(announcement.description) ? "truncated" : ""
                                            }`}
                                            style={{ whiteSpace: "pre-line" }}
                                        >
                                            {isTruncated(announcement.description)
                                                ? `${announcement.description.substring(0, 150)}...`
                                                : announcement.description}
                                        </p>
                                        {isTruncated(announcement.description) && (
                                            <div className="read-more">Click to read full announcement</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="pagination-container-announcement">
                        <div className="pagination-announcement">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    className={`page-button-announcement ${
                                        currentPage === i + 1 ? "active" : ""
                                    }`}
                                    onClick={() => paginate(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Announcement Popup */}
                {isPopupOpen && selectedAnnouncement && (
                    <div
                        className="announcement-popup-overlay"
                        onClick={closePopup}
                    >
                        <div
                            className="announcement-popup"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="close-popup" onClick={closePopup}>
                                ✕
                            </button>
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
                                <p
                                    className="popup-description"
                                    style={{ whiteSpace: "pre-line" }}
                                >
                                    {selectedAnnouncement.description}
                                </p>

                                {selectedAnnouncement.content && (
                                    <div
                                        className="popup-full-content"
                                        dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }}
                                    />
                                )}

                                {selectedAnnouncement.author && (
                                    <div className="popup-metadata">
                                        <p><strong>Posted by:</strong> {selectedAnnouncement.author}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer className="announcement-footer" />
        </>
    );
}

export default Announcement;
