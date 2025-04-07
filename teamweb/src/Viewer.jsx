import React, { useState, useEffect, useCallback } from "react"; 
import Header from "./Viewer/Component/Header.jsx";
import Footer from "./Viewer/Component/Footer.jsx";
import "./Viewer.css";

function Viewer() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/homepage/images");
      if (!response.ok) throw new Error(`Failed to fetch images: ${response.status}`);
      const data = await response.json();
      setImages(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching images:", error);
      setError("Failed to load news images. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images]);

  const getPosition = (index) => {
    if (index === currentIndex) return "active";
    if (index === (currentIndex - 1 + images.length) % images.length) return "prev";
    if (index === (currentIndex + 1) % images.length) return "next";
    return "hidden";
  };

  return (
    <div className="page-container">
      <Header />

      <div className="main-container">
        <div className="welcome-section">
          <h1 className="welcome-text">
            <span className="welcome-small">WELCOME TO</span> <br />
            <span className="teamian-text">Teamian</span> <span className="web-text">Web</span>
          </h1>
          <p className="welcome-description">
            Empowering students through innovative education and technology
          </p>
          <a href="announcement" className="explore-btn">Explore →</a>
        </div>

        <div className="school-image-container">
          <img src="/assets/images/school.jpg" alt="School" className="school-image" />
        </div>
      </div>

      <div className="latest-news">
        <h2>LATEST NEWS</h2>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading news...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : images.length > 0 ? (
          <>
            <div className="news-container">
              {images.map((image, index) => {
                const position = getPosition(index);
                return (
                  <div
                    key={index}
                    className={`news-item ${position}`}
                  >
                    <img
                      src={`http://localhost:3000/homepage/${image.image_url}`}
                      alt={`News ${index + 1}`}
                      className="news-image"
                    />
                    <div className="news-title-overlay">
                      {image.title || `News ${index + 1}`}
                    </div>
                  </div>
                );
              })}

              <div className="carousel-dots">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`dot ${currentIndex === index ? "active" : ""}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="no-content-message">
            <p>No news items available at this time.</p>
            <button className="refresh-btn" onClick={fetchImages}>Refresh</button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Viewer;