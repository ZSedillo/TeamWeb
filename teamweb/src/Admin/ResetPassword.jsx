import React, { useState, useEffect } from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router";
import './ResetPassword.css';
import TeamLogo from "../assets/images/TeamLogo.png";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get token from location state (passed from ForgotPassword component)
  const resetToken = location.state?.resetToken;
  
  // If no token is present, redirect to forgot password page
  useEffect(() => {
    if (!resetToken) {
      navigate('/forgot-password');
    }
  }, [resetToken, navigate]);

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // if (newPassword.length < 8) {
    //   setError("Password must be at least 8 characters long");
    //   return;
    // }
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch('https://teamweb-kera.onrender.com/user/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          password: newPassword, 
          token: resetToken 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }
      
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <img src={TeamLogo} alt="Team Logo" className="team-logo" /> {/* Logo at the top left */}
      <div className="container">
        <div className="form-box">
          <div className="form-content">
            <FaLock className="admin-icon" />
            <div className="title">RESET PASSWORD</div>
            
            {success ? (
              <div className="success-message">
                <p>Password reset successful!</p>
                <p>Redirecting to login page...</p>
              </div>
            ) : (
              <>
                <p className="description">
                  Please enter your new password below.
                </p>
                {error && <p className="error-message">{error}</p>}
                <br />
                <form onSubmit={handleSubmit}>
                  <div className="password-input-container">
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      placeholder="New Password" 
                      className="input-field" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <span className="password-toggle-icon" onClick={toggleNewPasswordVisibility}>
                      {showNewPassword ? <FaEye /> : <FaEyeSlash />}
                    </span>
                  </div>
                  
                  <div className="password-input-container">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirm Password" 
                      className="input-field" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <span className="password-toggle-icon" onClick={toggleConfirmPasswordVisibility}>
                      {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                    </span>
                  </div>
                  
                  <button type="submit" className="btn" disabled={isLoading}>
                    {isLoading ? "PROCESSING..." : "RESET PASSWORD"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ResetPassword;