import React, { useState } from "react";
import Header from '../Component/Header.jsx';
import Footer from '../Component/Footer.jsx';
import "./SchoolInfo.css";
import Pres from "../../assets/images/FacultyMembers/President.png";
import Vice from "../../assets/images/FacultyMembers/Vice.png";
import Bishop from "../../assets/images/FacultyMembers/TMPIboard1.png";
import Josephine from "../../assets/images/FacultyMembers/TMPIboard2.png";
import Principal from "../../assets/images/FacultyMembers/Principal.png";
import Dyna from "../../assets/images/FacultyMembers/Dyna.png";
import Claire from "../../assets/images/FacultyMembers/Claire.png";
import Shirley from "../../assets/images/FacultyMembers/Shirley.png";
import Maria from "../../assets/images/FacultyMembers/Maria.png";
import Hasel from "../../assets/images/FacultyMembers/Hasel.png";
import Marvelyn from "../../assets/images/FacultyMembers/Marvelyn.png";
import Katherine from "../../assets/images/FacultyMembers/Katherine.png";
import Monica from "../../assets/images/FacultyMembers/Monica.png";
import Louie from "../../assets/images/FacultyMembers/Louie.png";
import Nikka from "../../assets/images/FacultyMembers/Nikka.png";
import Alejandria from "../../assets/images/FacultyMembers/Alejandria.png";
import Jhanuarie from "../../assets/images/FacultyMembers/Jhanuarie.png";
import Charmaine from "../../assets/images/FacultyMembers/Charmaine.png";
import Teresita from "../../assets/images/FacultyMembers/Teresita.png";
import Gertrudes from "../../assets/images/FacultyMembers/LiaisonOfficer.png";
import Flor from "../../assets/images/FacultyMembers/Flor.png";
import Raquela from "../../assets/images/FacultyMembers/Registrar.png";

const facultyData = {
    administrators: [
        { name: "Engr. Romeo A. Corpuz, Jr.", role: "President", img: Pres },
        { name: "Ptra. Lenora A. Corpuz", role: "Vice President", img: Vice },
        { name: "Bishop Florante A. Rola", role: "TMPI Board", img: Bishop },
        { name: "Ptra. Josephine D. Bermeo", role: "TMPI Board", img: Josephine },
        { name: "Mrs. Erlinda C. Gonzales", role: "Principal", img: Principal },
    ],
    facultyCouncil: [
        { name: "Mrs. Dyna Lyn B. Tangalin", role: "Teacher", img: Dyna },
        { name: "Mrs. Claire Bloom P. Faraon", role: "Teacher", img: Claire },
        { name: "Mrs. Shirley V. Maximo", role: "Teacher", img: Shirley },
        { name: "Mrs. Maria Cristina M.Guinto", role: "Teacher", img: Maria },
        { name: "Ms. Hasel Marco", role: "Teacher", img: Hasel },
        { name: "Ms. Marvelyn Joy Bumatay", role: "Teacher", img: Marvelyn },
        { name: "Mrs. Kathrine Joy Prado", role: "Teacher", img: Katherine },
        { name: "Ms. Monica Amascual", role: "Teacher", img: Monica },
        { name: "Ms. Louie Anna Dianan", role: "Teacher", img: Louie },
        { name: "Ms. Nikka Bless Hulguin", role: "Teacher", img: Nikka },
        { name: "Mrs. Alejandria Jandoc", role: "Teacher", img: Alejandria },
        { name: "Ms. Jhanuarie Mae Borja", role: "Teacher", img: Jhanuarie },
        { name: "Ms. Charmaine Suarez", role: "Teacher", img: Charmaine },
        { name: "Mrs. Maria Teresita L.", role: "Subject Teacher", img: Teresita },
    ],
    supportStaff: [
        { name: "Mrs. Gertrudes Corpuz", role: "Liaison Officer", img: Gertrudes },
        { name: "Mrs. Flor Parungao", role: "Cashier", img: Flor },
        { name: "Mrs. Raquela Pangyarihan", role: "Registrar", img: Raquela }
    ]
};

// Data for subjects per grade
const subjectsData = {
    "KINDERGARTEN 1": ["Alphabet Recognition", "Basic Counting", "Arts & Crafts"],
    "KINDERGARTEN 2": ["Reading Readiness", "Numbers & Shapes", "Music & Movement"],
    "GRADE 1": ["Math", "English", "Science", "Filipino", "PE"],
    "GRADE 2": ["Math", "English", "Science", "Filipino", "Araling Panlipunan"],
    "GRADE 3": ["Math", "English", "Science", "Filipino", "Computer"],
    "GRADE 4": ["Math", "English", "Science", "Filipino", "HELE"],
    "GRADE 5": ["Math", "English", "Science", "Filipino", "Social Studies"],
    "GRADE 6": ["Math", "English", "Science", "Filipino", "ICT"],
    "GRADE 7": ["Math", "English", "Science", "History", "TLE"],
    "GRADE 8": ["Math", "English", "Science", "History", "TLE"],
    "GRADE 9": ["Math", "English", "Science", "History", "TLE"],
    "GRADE 10": ["Math", "English", "Science", "History", "TLE"],
};

// Core Values data
const coreValues = [
    { value: "Love for God", description: "Demonstrating devotion and commitment to God in all aspects of life." },
    { value: "Integrity", description: "Upholding moral and ethical principles in all circumstances." },
    { value: "Unity", description: "Working together in harmony for common goals and purposes." },
    { value: "Accountability", description: "Taking responsibility for one's actions and decisions." },
    { value: "Relationship", description: "Building meaningful connections with God, family, and community." },
    { value: "Fear of God", description: "Reverence and respect for God's authority and guidance." },
    { value: "Discipline", description: "Self-control and adherence to established standards and expectations." },
    { value: "Obedience", description: "Willing compliance with rules, laws, and godly principles." }
];

// Senior High School Strands
const seniorHighStrands = [
    "Science, Technology, Engineering & Mathematics (STEM)",
    "Accountancy, Business, and Management (ABM)",
    "Humanities and Social Sciences (HUMSS)"
];

// Data for Facilities
const facilitiesData = {
    "Laboratory": "/path-to-lab-image.jpg",
    "Music Room": "/path-to-music-room-image.jpg",
    "Chapel": "/path-to-church-image.jpg",
    "Health Clinic": "/path-to-clinic-image.jpg",
    "Student Lounge": "/path-to-lounge-image.jpg",
    "Cafeteria": "/path-to-canteen-image.jpg",
    "Sports Court": "/path-to-court-image.jpg",
};

function SchoolInfo() {
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
    const [expandedValue, setExpandedValue] = useState(null);

    // Function to open grade modal
    const openModal = (grade) => {
        setSelectedGrade(grade);
        setIsModalOpen(true);
    };

    // Function to close grade modal
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedGrade(null);
    };

    // Function to open facility modal
    const openFacilityModal = (facility) => {
        setSelectedFacility(facility);
        setIsFacilityModalOpen(true);
    };

    // Function to close facility modal
    const closeFacilityModal = () => {
        setIsFacilityModalOpen(false);
        setSelectedFacility(null);
    };

    // Function to toggle expanded value
    const toggleExpandValue = (value) => {
        if (expandedValue === value) {
            setExpandedValue(null);
        } else {
            setExpandedValue(value);
        }
    };

    return (
        <div className="school-info-container">
            <Header />

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Team Mission Christian School</h1>
                    <p>Nurturing Excellence through Faith and Knowledge</p>
                </div>
            </section>

            {/* About Us Section */}
            <section className="section about-section">
                <div className="section-header">
                    <h2>ABOUT US</h2>
                    <div className="section-underline"></div>
                </div>
                <div className="about-content">
                    <div className="about-text">
            {/* Vision, Mission and Philosophy section */}
                <div className="about-columns">
                <div className="about-subsection">
                    <h3 className="subsection-title">Vision</h3>
                    <p>
                    TMCS envisions to produce graduates instilled with Godly character and values, intellectual competence and proficient skills who will become leaders of the nations.
                    </p>
                </div>
                <div className="about-subsection">
                    <h3 className="subsection-title">Philosophy</h3>
                    <p>
                    TMCS is a non-stock, non-profit Christian School and the educational arm of Team Mission Philippines Inc.
                    We believe that God is the central figure in the School's Curriculum and education.
                    We believe in the partnership of the parents and the school that God has given the parents the primary responsibility to educate their children and the second responsibility to the school and its teachers.
                    We believe in the correct balance of love and discipline which is anchored in Proverbs 22:6, "Train up a child in the way he should go, and when he is old, we will not depart from it."
                    </p>
                </div>
                <div className="about-subsection">
                    <h3 className="subsection-title">Mission</h3>
                    <p>
                    To provide quality education by nurturing and empowering the child's intelligence for the glory of God.
                    </p>
                </div>
                </div>
                        {/* Core Values Section - Redesigned */}
                        <div className="about-subsection core-values-section">
                            <h3 className="subsection-title">Core Values</h3>
                            <div className="core-values-container">
                                {coreValues.map((item, index) => (
                                    <div 
                                        key={index} 
                                        className={`core-value-item ${expandedValue === item.value ? 'expanded' : ''}`}
                                        // onClick={() => toggleExpandValue(item.value)}
                                    >
                                        <div className="core-value-header">
                                            <span className="core-value-icon">✦</span>
                                            <h4 className="core-value-name">{item.value}</h4>
                                            <span className="expand-icon">{expandedValue === item.value ? '−' : '+'}</span>
                                        </div>
                                        {/* {expandedValue === item.value && (
                                            <p className="core-value-description">{item.description}</p>
                                        )} */}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Offered Courses Section */}
            <section className="section courses-section">
                <div className="section-header">
                    <h2>ACADEMIC PROGRAMS</h2>
                    <div className="section-underline"></div>
                </div>

                <div className="courses-container">
                    <div className="grade-levels">
                        <h3>GRADE LEVELS</h3>
                        <div className="course-list">
                            {Object.keys(subjectsData).map((grade) => (
                                <button key={grade} className="course-button" >
                                    {grade}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="senior-high">
                        <h3>SENIOR HIGH SCHOOL STRANDS</h3>
                        <ul className="strand-list">
                            {seniorHighStrands.map((strand, index) => (
                                <li key={index}>{strand}</li>
                            ))}
                        </ul>
                        <div className="esc-subsidy">With ESC Subsidy!</div>
                    </div>
                </div>
            </section>

            {/* School Facilities Section */}
            <section className="section facilities-section">
                <div className="section-header">
                    <h2>CAMPUS FACILITIES</h2>
                    <div className="section-underline"></div>
                </div>
                <div className="facilities-container">
                    {Object.keys(facilitiesData).map((facility) => (
                        <button key={facility} className="facility-button">
                            {facility}
                        </button>
                    ))}
                </div>
            </section>

            {/* Faculty and Staff Section */}
            <section className="section faculty-section">
                <div className="section-header">
                    <h2>FACULTY AND STAFF</h2>
                    <div className="section-underline"></div>
                </div>

                {/* Administrators */}
                <div className="faculty-category">
                    <h3>ADMINISTRATORS</h3>
                    <div className="faculty-grid">
                        {facultyData.administrators.map((member, index) => (
                            <div className="faculty-card" key={index}>
                                <div className="faculty-photo">
                                    <img src={member.img} alt={member.name} />
                                </div>
                                <div className="faculty-info">
                                    <h4>{member.name}</h4>
                                    <p>{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Faculty Council */}
                <div className="faculty-category">
                    <h3>FACULTY COUNCIL</h3>
                    <div className="faculty-grid">
                        {facultyData.facultyCouncil.map((member, index) => (
                            <div className="faculty-card" key={index}>
                                <div className="faculty-photo">
                                    <img src={member.img} alt={member.name} />
                                </div>
                                <div className="faculty-info">
                                    <h4>{member.name}</h4>
                                    <p>{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Support Staff */}
                <div className="faculty-category">
                    <h3>SUPPORT STAFF</h3>
                    <div className="faculty-grid">
                        {facultyData.supportStaff.map((member, index) => (
                            <div className="faculty-card" key={index}>
                                <div className="faculty-photo">
                                    <img src={member.img} alt={member.name} />
                                </div>
                                <div className="faculty-info">
                                    <h4>{member.name}</h4>
                                    <p>{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Grade Modal Popup */}
            {isModalOpen && selectedGrade && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-button" onClick={closeModal}>×</button>
                        <h3>{selectedGrade} Curriculum</h3>
                        <ul className="subject-list">
                            {subjectsData[selectedGrade].map((subject, index) => (
                                <li key={index}>{subject}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Facility Modal Popup */}
            {isFacilityModalOpen && selectedFacility && (
                <div className="modal-overlay" onClick={closeFacilityModal}>
                    <div className="modal-content facility-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-button" onClick={closeFacilityModal}>×</button>
                        <h3>{selectedFacility}</h3>
                        <div className="facility-image">
                            <img src={facilitiesData[selectedFacility]} alt={selectedFacility} />
                        </div>
                        <p className="facility-description">
                            Our state-of-the-art {selectedFacility.toLowerCase()} provides students with an excellent environment for learning and development.
                        </p>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

export default SchoolInfo;