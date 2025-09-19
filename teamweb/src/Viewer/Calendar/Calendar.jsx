import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../Component/Header.jsx";
import Footer from "../Component/Footer.jsx";
import { fetchCalendarEvents } from "../../_actions/calendar.actions.js";
import "./calendar.css";

const Calendar = () => {
  const dispatch = useDispatch();
  const { events, loading, error } = useSelector((state) => state.calendarState);

  const initialYear = new Date().getFullYear();
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [hasSeenInitialYear, setHasSeenInitialYear] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(new Date().toISOString().split("T")[0]);
    dispatch(fetchCalendarEvents());
  }, [dispatch]);

  // Static holidays (same as your previous data)
  const staticHolidays = [
    { title: "New Year's Day", month: 0, day: 1 },
    { title: "Araw ng Kagitingan", month: 3, day: 9 },
    { title: "Maundy Thursday", month: 2, day: 28 },
    { title: "Good Friday", month: 2, day: 29 },
    { title: "Labor Day", month: 4, day: 1 },
    { title: "Independence Day", month: 5, day: 12 },
    { title: "National Heroes Day", month: 7, day: 26 },
    { title: "Bonifacio Day", month: 10, day: 30 },
    { title: "Christmas Day", month: 11, day: 25 },
    { title: "Rizal Day", month: 11, day: 30 },
    { title: "Chinese New Year", month: 1, day: 10 },
    { title: "EDSA People Power Revolution", month: 1, day: 25 },
    { title: "All Saints' Day", month: 10, day: 1 },
    { title: "All Souls' Day", month: 10, day: 2 },
    { title: "Christmas Eve", month: 11, day: 24 },
    { title: "New Year's Eve", month: 11, day: 31 },
    { title: "Eid’l Fitr", month: 3, day: 10 },
    { title: "Eid’l Adha", month: 5, day: 20 },
    { title: "Martin Luther King Jr. Day", month: 0, day: 15 },
    { title: "Valentine's Day", month: 1, day: 14 },
    { title: "Presidents' Day", month: 1, day: 15 },
    { title: "St. Patrick's Day", month: 2, day: 17 },
    { title: "Easter", month: 3, day: 9 },
    { title: "Mother's Day", month: 4, day: 11 },
    { title: "Memorial Day", month: 4, day: 26 },
    { title: "Father's Day", month: 5, day: 15 },
    { title: "Labor Day (US)", month: 8, day: 1 },
    { title: "Columbus Day", month: 9, day: 13 },
    { title: "Halloween", month: 9, day: 31 },
    { title: "Veterans Day", month: 10, day: 11 },
    { title: "Thanksgiving", month: 10, day: 27 },
  ];

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  const formatDate = (year, month, day) => `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

  const getHolidayForDate = (year, month, day) => {
    const holiday = staticHolidays.find(h => h.month === month && h.day === day);
    return holiday ? { ...holiday, date: formatDate(year, month, day), type: "holiday" } : null;
  };

  const getEventOrHoliday = (dateStr) => {
    if (!dateStr) return { event: null, holiday: null };
    const [year, month, day] = dateStr.split('-').map(Number);
    const event = events.find(item => item.date.slice(0,10) === dateStr);
    const holiday = getHolidayForDate(year, month - 1, day);
    return { event, holiday };
  };

  const handleMouseEnter = (event, text) => {
    const rect = event.target.getBoundingClientRect();
    setTooltip({ visible: true, text, x: rect.left + window.scrollX + rect.width/2, y: rect.top + window.scrollY - 30 });
  };

  const handleMouseLeave = () => setTooltip({ visible: false, text: "", x:0, y:0 });

  const prevYear = () => {
    if (currentYear > initialYear) {
      setCurrentYear(currentYear - 1);
      if (currentYear - 1 === initialYear) setHasSeenInitialYear(true);
    }
  };

  const nextYear = () => {
    if (currentYear < initialYear + 1 && (currentYear === initialYear || hasSeenInitialYear)) {
      setCurrentYear(currentYear + 1);
    }
  };

  const getUpcomingHolidays = () => {
    const currentDate = new Date();
    return staticHolidays
      .map(h => ({ ...h, date: formatDate(currentYear, h.month, h.day), type: "holiday" }))
      .filter(h => new Date(h.date) >= currentDate)
      .sort((a,b) => new Date(a.date) - new Date(b.date));
  };

  const currentEventOrHoliday = getEventOrHoliday(today);

  return (
    <>
      <Header />
      <div className="calendar-container">
        <div className="calendar-header">
          <button onClick={prevYear} disabled={currentYear===initialYear}>❮ Prev Year</button>
          <h2>{currentYear}</h2>
          <button onClick={nextYear} disabled={currentYear>=initialYear+1}>Next Year ❯</button>
        </div>

        {loading && <p>Loading events...</p>}
        {error && <p className="error-message">Error: {error}</p>}

        {currentEventOrHoliday.event && <div className="current-event">Current Event: {currentEventOrHoliday.event.title}</div>}
        {currentEventOrHoliday.holiday && <div className="current-holiday">Current Holiday: {currentEventOrHoliday.holiday.title}</div>}

        <div className="full-year-calendar">
          {months.map((month, index) => {
            const daysInMonth = getDaysInMonth(currentYear, index);
            const firstDay = getFirstDayOfMonth(currentYear, index);
            return (
              <div key={index} className="calendar-month">
                <h3>{month} {currentYear}</h3>
                <table>
                  <thead>
                    <tr>{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day => <th key={day}>{day}</th>)}</tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, week) => (
                      <tr key={week}>
                        {Array.from({ length: 7 }).map((_, day) => {
                          const dateNumber = week*7 + day - firstDay + 1;
                          const isValid = dateNumber>0 && dateNumber<=daysInMonth;
                          const dateStr = isValid ? formatDate(currentYear, index, dateNumber) : "";
                          const { event, holiday } = getEventOrHoliday(dateStr);
                          const isToday = dateStr===today;
                          const className = isToday ? "today" : event ? "event-day" : holiday ? "holiday-day" : "";
                          const tooltipText = event && holiday ? `${event.title} & ${holiday.title}` : event?.title || holiday?.title || "";
                          return (
                            <td key={day} className={className} onMouseEnter={tooltipText ? (e)=>handleMouseEnter(e,tooltipText) : null} onMouseLeave={handleMouseLeave}>
                              {isValid ? dateNumber : ""}
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

        {/* Upcoming Events */}
        {events.filter(item=>new Date(item.date).getFullYear()===currentYear && new Date(item.date)>=new Date()).length>0 && (
          <div className="events-section">
            <h3>Upcoming Events</h3>
            <ul>
              {events.filter(item=>new Date(item.date).getFullYear()===currentYear && new Date(item.date)>=new Date())
                .sort((a,b)=>new Date(a.date)-new Date(b.date))
                .map((event,index)=>{
                  const dateObj=new Date(event.date);
                  return (
                    <li key={index} className="event-item">
                      <span className="event-date">{months[dateObj.getMonth()]} {dateObj.getDate()}</span>
                      <span className="event-name">{event.title}</span>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}

        {/* Upcoming Holidays */}
        {getUpcomingHolidays().length>0 && (
          <div className="events-section">
            <h3>Upcoming Holidays</h3>
            <ul>
              {getUpcomingHolidays().map((holiday,index)=>{
                const dateObj=new Date(holiday.date);
                return (
                  <li key={index} className="holiday-item">
                    <span className="holiday-date">{months[dateObj.getMonth()]} {dateObj.getDate()}</span>
                    <span className="holiday-name">{holiday.title}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {tooltip.visible && (
          <div className="tooltip visible" style={{position:"absolute", left:`${tooltip.x}px`, top:`${tooltip.y}px`}}>
            {tooltip.text}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Calendar;
