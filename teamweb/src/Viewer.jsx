import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchHomepageImages } from "./_actions/homepage.actions";
import Header from "./Viewer/Component/Header.jsx";
import Footer from "./Viewer/Component/Footer.jsx";
import School from "./assets/images/School.jpg";
import "./Viewer.css";

function Viewer() {
  const dispatch = useDispatch();
  const { images, loading: isLoading, error } = useSelector(state => state.homepage);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    dispatch(fetchHomepageImages());
  }, [dispatch]);

  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [images]);

  const getPosition = (index) => {
    if (index === currentIndex) return "active";
    if (index === (currentIndex - 1 + images.length) % images.length) return "prev";
    if (index === (currentIndex + 1) % images.length) return "next";
    return "hidden";
  };

  const handleRefresh = () => {
    dispatch(fetchHomepageImages());
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
          <img src={School} alt="School" className="school-image" />
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
          <div className="error-message">
            {error}
            <button className="refresh-btn" onClick={handleRefresh}>
              Try Again
            </button>
          </div>
        ) : images.length > 0 ? (
          <>
            <div className="news-container">
              {images.map((image, index) => {
                const position = getPosition(index);
                return (
                  <div
                    key={image._id || index}
                    className={`news-item ${position}`}
                  >
                    <img
                      src={image.image_url}
                      alt={image.title || `News ${index + 1}`}
                      className="news-image"
                    />
                    {/* Enhanced overlay with title and description */}
                    <div className="news-title-overlay">
                      <h3 className="news-title">
                        {image.description || `News ${index + 1}`}
                      </h3>
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
            <button className="refresh-btn" onClick={handleRefresh}>Refresh</button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Viewer;