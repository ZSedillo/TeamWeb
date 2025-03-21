import React, { useState } from "react";
import { useNavigate } from "react-router"; // For navigation
import { FaUser, FaExclamationCircle } from "react-icons/fa"; // Import error icon
import "./Login.css";
import TeamLogo from "../assets/images/TeamLogo.png";

function Login() {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [error, setError] = useState(""); // State for error messages
    const navigate = useNavigate(); // Hook for navigation

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); 
        console.log(formData); // Debugging
        try {
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
    
            const data = await response.json();
            if (response.status === 200 && data.token) {
                localStorage.setItem("token", data.token); // Save token
                localStorage.setItem("username", formData.username); // Save username
                navigate("/admin-homepage"); // Navigate to the admin homepage
            } else {
                setError(`Error: ${data.error || "Login failed"}`);
            }
        } catch (error) {
            setError("Error: An error occurred. Please try again.");
        }
    };
    
    
    

    return (
        <div className="page-container">
            <img src={TeamLogo} alt="Team Logo" className="team-logo" /> {/* Logo at the top left */}
            <div className="container">
                <div className="form-box">
                    <div className="form-content">
                        <FaUser className="admin-icon" />
                        <div className="title">HI ADMIN!</div>
                        {error && (
                            <div className="error-box">
                                <FaExclamationCircle className="error-icon" />
                                <span>{error}</span>
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="username"
                                placeholder="USERNAME"
                                className="input-field"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="PASSWORD"
                                className="input-field"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button type="submit" className="btn">LOGIN</button>
                        </form>
                        <a href="/reset-password" className="forgot-password">Forgot Password?</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
