import React, { useState } from 'react';
import { FaMapMarkerAlt, FaEnvelope, FaPhone, FaFacebookF, FaTimes } from "react-icons/fa";
import { Users, GraduationCap } from 'lucide-react';
import "./Footer.css";

const Footer = () => {
  const [isTeamPopupOpen, setIsTeamPopupOpen] = useState(false);

  const teamMembers = [
    {
      role: "Project Manager",
      members: ["Christian Andrew Louis M. Reynancia"],
      icon: "👨‍💼",
      color: "bg-blue-500"
    },
    {
      role: "System Analyst",
      members: ["Zandro Miguel B. Sedillo"],
      icon: "🔍",
      color: "bg-purple-500"
    },
    {
      role: "Business Analyst",
      members: ["Oliver Deniel C. Garcia", "Gabriel John Angelo F. Lumanog"],
      icon: "📊",
      color: "bg-green-500"
    },
    {
      role: "Project Developer",
      members: ["Sofia Marie Pauline S. Caldit", "Marc Gyronne Gocon"],
      icon: "💻",
      color: "bg-orange-500"
    },
    {
      role: "Quality Assurance",
      members: ["Gericko John Anthony F. Lumanog", "Gian Joachim A. Ferrer"],
      icon: "✅",
      color: "bg-red-500"
    }
  ];

  return (
    <>
      <footer className="footer">
        <div className="footer-container">
          {/* Top Row: Branding & Links */}
          <div className="footer-top">
            {/* Left: Branding */}
            <div className="footer-brand">
              <h2>Teamian<span>Web</span></h2>
              <p className="tagline">YES WE CAN!</p>
              <div className="footer-contact-info">
                <p><FaMapMarkerAlt /> 226 Lambakin, Marilao Bulacan</p>
                <p><FaEnvelope /> tmcs1983@gmail.com</p>
                <p><FaPhone /> 0956-099-3796</p>
                <p><FaFacebookF /> Team Mission Christian School, Inc</p>
              </div>
            </div>

            {/* Right: Links */}
            <div className="footer-links-container">
              <div className="footer-links-column">
                <h3>About Us</h3>
                <div className="footer-links">
                  <a href="/schoolinfo#mission">Mission</a>
                  <a href="/schoolinfo#vision">Vision</a>
                  <a href="/schoolinfo#core-values">Core Values</a>
                </div>
              </div>
              
              <div className="footer-links-column">
                <h3>School Programs</h3>
                <div className="footer-links">
                  <a>School Clinic</a>
                  <a>Academic Programs</a>
                  <a href="/calendar">School Calendar</a>
                </div>
              </div>
              
              <div className="footer-links-column">
                <h3>Website</h3>
                <div className="footer-links">
                  <a>Accessibility Statement</a>
                  <a>Non-Discrimination Policy</a>
                  <a>Privacy Policy</a>
                  <a 
                    onClick={() => setIsTeamPopupOpen(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    Development Team
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Copyright */}
          <div className="footer-bottom">
            <hr className="footer-divider" />
            <p>Copyright © 2024 The Exceptionals. All rights reserved</p>
          </div>
        </div>
      </footer>

      {/* Team Credits Popup */}
      {isTeamPopupOpen && (
        <div className="team-popup-overlay">
          <div className="team-popup">
            {/* Header */}
            <div className="team-popup-header">
              <div className="team-popup-title">
                <Users className="w-6 h-6" />
                <h3>Development Team</h3>
              </div>
              <button
                onClick={() => setIsTeamPopupOpen(false)}
                className="team-popup-close"
              >
                <FaTimes />
              </button>
            </div>

            {/* Content */}
            <div className="team-popup-content">
              {/* University Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #fff7ed 0%, #fef2f2 100%)',
                border: '1px solid #fed7aa',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <GraduationCap style={{ width: '24px', height: '24px', color: '#d97706' }} />
                <div>
                  <h4 style={{ 
                    margin: '0 0 4px 0', 
                    fontWeight: '700', 
                    color: '#1e293b',
                    fontSize: '16px'
                  }}>
                    University of Santo Tomas
                  </h4>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '14px', 
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    Our development team proudly represents UST
                  </p>
                </div>
              </div>

              {teamMembers.map((team, index) => (
                <div key={index} className="team-section">
                  <div className="team-role-header">
                    <div className={`team-role-icon ${team.color}`}>
                      <span style={{ fontSize: '16px' }}>{team.icon}</span>
                    </div>
                    <h4>{team.role}</h4>
                  </div>
                  <div className="team-members">
                    {team.members.map((member, memberIndex) => (
                      <div key={memberIndex} className="team-member">
                        <div className="member-avatar">
                          {member.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span>{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="team-popup-footer">
              <p>Thank you to all UST team members for their dedication and excellence.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;