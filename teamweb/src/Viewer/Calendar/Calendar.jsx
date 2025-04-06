import React, { useState, useEffect } from "react";
import "./calendar.css";
import Header from "../Component/Header.jsx";
import Footer from "../Component/Footer.jsx";

const Calendar = () => {
  const initialYear = new Date().getFullYear(); // Get the current year dynamically
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [hasSeenInitialYear, setHasSeenInitialYear] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });
  const [today, setToday] = useState("");
  const [events, setEvents] = useState([]);

  // Static holidays data (month is 0-indexed: January = 0, December = 11)
  const staticHolidays = [
    // Regular Holidays in the Philippines
    { title: "New Year's Day", month: 0, day: 1 },
    { title: "Araw ng Kagitingan", month: 3, day: 9 }, // April 9
    { title: "Maundy Thursday", month: 2, day: 28 }, // Approximate, changes yearly
    { title: "Good Friday", month: 2, day: 29 }, // Approximate, changes yearly
    { title: "Labor Day", month: 4, day: 1 }, // May 1
    { title: "Independence Day", month: 5, day: 12 }, // June 12
    { title: "National Heroes Day", month: 7, day: 26 }, // Last Monday of August (approximate)
    { title: "Bonifacio Day", month: 10, day: 30 }, // November 30
    { title: "Christmas Day", month: 11, day: 25 }, // December 25
    { title: "Rizal Day", month: 11, day: 30 }, // December 30
  
    // Special (Non-Working) Holidays
    { title: "Chinese New Year", month: 1, day: 10 }, // Usually between Jan 21 - Feb 20
    { title: "EDSA People Power Revolution", month: 1, day: 25 }, // February 25
    { title: "All Saints' Day", month: 10, day: 1 }, // November 1
    { title: "All Souls' Day", month: 10, day: 2 }, // November 2
    { title: "Christmas Eve", month: 11, day: 24 }, // December 24
    { title: "New Year's Eve", month: 11, day: 31 }, // December 31
  
    // Movable Islamic Holidays (Eid'l Fitr & Eid'l Adha)
    { title: "Eid’l Fitr", month: 3, day: 10 }, // Approximate, based on lunar calendar
    { title: "Eid’l Adha", month: 5, day: 20 }, // Approximate, based on lunar calendar
  
    // US Holidays (For reference)
    { title: "Martin Luther King Jr. Day", month: 0, day: 15 }, // Third Monday in January (approximate)
    { title: "Valentine's Day", month: 1, day: 14 },
    { title: "Presidents' Day", month: 1, day: 15 }, // Third Monday in February (approximate)
    { title: "St. Patrick's Day", month: 2, day: 17 },
    { title: "Easter", month: 3, day: 9 }, // Approximate for 2025
    { title: "Mother's Day", month: 4, day: 11 }, // Second Sunday in May (approximate)
    { title: "Memorial Day", month: 4, day: 26 }, // Last Monday in May (approximate)
    { title: "Father's Day", month: 5, day: 15 }, // Third Sunday in June (approximate)
    { title: "Labor Day (US)", month: 8, day: 1 }, // First Monday in September (approximate)
    { title: "Columbus Day", month: 9, day: 13 }, // Second Monday in October (approximate)
    { title: "Halloween", month: 9, day: 31 },
    { title: "Veterans Day", month: 10, day: 11 },
    { title: "Thanksgiving", month: 10, day: 27 } // Fourth Thursday in November (approximate)
  ];
  
  useEffect(() => {
    setToday(new Date().toISOString().split("T")[0]);

    // Only fetch events from the API, not holidays
    fetch("https://teamweb-kera.onrender.com/calendar")
      .then((response) => response.json())
      .then((data) => {
        // Filter only events from the API data
        setEvents(data.calendar?.filter(item => item.type === "event") || []);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
      });
  }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Generate holiday data for a specific date
  const getHolidayForDate = (year, month, day) => {
    const holiday = staticHolidays.find(h => h.month === month && h.day === day);
    if (holiday) {
      return {
        ...holiday,
        date: formatDate(year, month, day),
        type: "holiday"
      };
    }
    return null;
  };

  // Get event and holiday for a specific date
  const getEventOrHoliday = (dateStr) => {
    if (!dateStr) return { event: null, holiday: null };
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const event = events.find(item => item.date.slice(0, 10) === dateStr);
    const holiday = getHolidayForDate(year, month - 1, day); // month - 1 because months are 0-indexed in our static data
    
    return { event, holiday };
  };

  const handleMouseEnter = (event, text) => {
    const rect = event.target.getBoundingClientRect();
    setTooltip({
      visible: true,
      text,
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 30,
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, text: "", x: 0, y: 0 });
  };

  const currentEventOrHoliday = getEventOrHoliday(today);

  // Generate a list of upcoming holidays for the current year
  const getUpcomingHolidays = () => {
    const currentDate = new Date();
    const upcomingHolidays = [];
    
    staticHolidays.forEach(holiday => {
      const holidayDate = new Date(currentYear, holiday.month, holiday.day);
      if (holidayDate >= currentDate) {
        upcomingHolidays.push({
          ...holiday,
          date: formatDate(currentYear, holiday.month, holiday.day),
          type: "holiday"
        });
      }
    });
    
    return upcomingHolidays.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const prevYear = () => {
    if (currentYear > initialYear) {
      setCurrentYear(currentYear - 1);
      if (currentYear - 1 === initialYear) {
        setHasSeenInitialYear(true);
      }
    }
  };

  const nextYear = () => {
    if (currentYear < initialYear + 1 && (currentYear === initialYear || hasSeenInitialYear)) {
      setCurrentYear(currentYear + 1);
    }
  };

  return (
    <>
      <Header />
      <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={prevYear} disabled={currentYear === initialYear}>❮ Prev Year</button>
        <h2>{currentYear}</h2>
        <button onClick={nextYear} disabled={currentYear >= initialYear + 1}>Next Year ❯</button>
      </div>

        {currentEventOrHoliday.event && (
          <div className="current-event">Current Event: {currentEventOrHoliday.event.title}</div>
        )}
        {currentEventOrHoliday.holiday && (
          <div className="current-holiday">Current Holiday: {currentEventOrHoliday.holiday.title}</div>
        )}

        <div className="full-year-calendar">
          {months.map((month, index) => {
            const daysInMonth = getDaysInMonth(currentYear, index);
            const firstDay = getFirstDayOfMonth(currentYear, index);
            return (
              <div key={index} className="calendar-month">
                <h3>{month} {currentYear}</h3>
                <table>
                  <thead>
                    <tr>
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <th key={day}>{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, week) => (
                      <tr key={week}>
                        {Array.from({ length: 7 }).map((_, day) => {
                          const dateNumber = week * 7 + day - firstDay + 1;
                          const isValidDate = dateNumber > 0 && dateNumber <= daysInMonth;
                          const dateStr = isValidDate ? formatDate(currentYear, index, dateNumber) : "";
                          const { event, holiday } = getEventOrHoliday(dateStr);
                          const isToday = dateStr === today;
                          const isHoliday = Boolean(holiday);
                          const className = isToday ? "today" : event ? "event-day" : isHoliday ? "holiday-day" : "";
                          const tooltipText = (event?.title && holiday?.title) 
                            ? `${event.title} & ${holiday.title}` 
                            : event?.title || holiday?.title || '';

                          return (
                            <td
                              key={day}
                              className={className}
                              onMouseEnter={(e) => tooltipText && handleMouseEnter(e, tooltipText)}
                              onMouseLeave={handleMouseLeave}
                            >
                              {isValidDate ? dateNumber : ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        <div className="events-section">
          {events.filter(item => 
            new Date(item.date).getFullYear() === currentYear && 
            new Date(item.date) >= new Date()
          ).length > 0 && (
            <>
              <h3>Upcoming Events</h3>
              <ul>
                {events
                  .filter(item => 
                    new Date(item.date).getFullYear() === currentYear && 
                    new Date(item.date) >= new Date()
                  )
                  .sort((a, b) => new Date(a.date) - new Date(b.date))  // Sorting by date
                  .map((event, index) => {
                    const dateObj = new Date(event.date);
                    const monthName = months[dateObj.getMonth()];
                    const day = dateObj.getDate();
                    return (
                      <li key={index} className="event-item">
                        <span className="event-date">{monthName} {day}</span>
                        <span className="event-name">{event.title}</span>
                      </li>
                    );
                  })}
              </ul>
            </>
          )}
        </div>

        <div className="events-section">
          {getUpcomingHolidays().length > 0 && (
            <>
              <h3>Upcoming Holidays</h3>
              <ul>
                {getUpcomingHolidays().map((holiday, index) => {
                  const dateObj = new Date(holiday.date);
                  const monthName = months[dateObj.getMonth()];
                  const day = dateObj.getDate();
                  return (
                    <li key={index} className="holiday-item">
                      <span className="holiday-date">{monthName} {day}</span>
                      <span className="holiday-name">{holiday.title}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {tooltip.visible && (
          <div
            className="tooltip visible"
            style={{
              position: "absolute",
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Calendar;