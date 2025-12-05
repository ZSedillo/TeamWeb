import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './ManageCalendar.css';
import AdminHeader from '../Component/AdminHeader.jsx';
import {
  fetchCalendarEvents,
  addCalendarEvent,
  editCalendarEvent,
  deleteCalendarEvent,
  deletePreviousYearEvents
} from '../../_actions/calendar.actions';

const ManageCalendar = () => {
  const dispatch = useDispatch();
  
  // 1. Get Calendar State
  const { events: rawEvents, loading, error } = useSelector((state) => state.calendarState || state.calendarReducer || {});
  
  // 2. Get User State (Fix for username logging)
  const { user } = useSelector((state) => state.user);
  const currentUsername = user?.username || "Admin";

  const initialYear = new Date().getFullYear();
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [hasSeenInitialYear, setHasSeenInitialYear] = useState(false);
  
  const [events, setEvents] = useState([]);
  
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventName, setNewEventName] = useState('');
  const [action, setAction] = useState('add'); 
  const [notification, setNotification] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });
  const [today, setToday] = useState('');
  
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  // Static holidays
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
    { title: "Eid'l Fitr", month: 3, day: 10 }, 
    { title: "Eid'l Adha", month: 5, day: 20 }, 
  ];

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
    dispatch(fetchCalendarEvents());
    dispatch(deletePreviousYearEvents());
  }, [dispatch]);

  // Sync Redux state with local 'events' format
  useEffect(() => {
    if (rawEvents) {
      const formattedEvents = rawEvents.map(item => ({
        id: item._id,
        date: item.date.slice(0, 10),
        name: item.title
      }));
      setEvents(formattedEvents);
    }
  }, [rawEvents]);

  // Show errors from Redux
  useEffect(() => {
    if (error) {
      showNotification(error, true);
    }
  }, [error]);

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

  const openAddModal = (date) => {
    setCurrentEvent(null);
    setNewEventDate(date);
    setNewEventName('');
    setAction('add');
    setIsModalOpen(true);
  };

  const openEditModal = (event) => {
    if (!event || !event.id) {
      openAddModal(event?.date || new Date().toISOString().split('T')[0]);
      return;
    }
    setCurrentEvent(event);
    setNewEventDate(event.date);
    setNewEventName(event.name);
    setAction('edit');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewEventDate('');
    setNewEventName('');
    setCurrentEvent(null);
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

  const addEvent = async () => {
      if (newEventName.trim() === '') return;

      const newEvent = { 
        date: newEventDate, 
        title: newEventName.trim(), 
        type: "event" 
      };

      // ✅ Pass currentUsername
      await dispatch(addCalendarEvent(newEvent, currentUsername));
      
      closeModal();
      showNotification('Event added successfully!');
  };

  const updateEvent = async () => {
      if (newEventName.trim() === '' || !currentEvent) return;

      const payload = { 
          date: newEventDate, 
          title: newEventName.trim(),
          type: "event"
      };

      // ✅ Pass currentUsername
      await dispatch(editCalendarEvent(currentEvent.id, payload, currentUsername));

      closeModal();
      showNotification('Event updated successfully!');
  };

  const confirmDelete = (eventToDelete) => {
    if (!eventToDelete?.id) return;
    setEventToDelete(eventToDelete);
    setIsConfirmationOpen(true);
  };
  
  const performDelete = async () => {
      if (!eventToDelete?.id) return;

      // ✅ Pass currentUsername
      await dispatch(deleteCalendarEvent(
        eventToDelete.id, 
        currentUsername, 
        eventToDelete.name, 
        eventToDelete.date
      ));

      closeModal();
      setIsConfirmationOpen(false);
      setEventToDelete(null);
      showNotification('Event deleted successfully!');
  };

  const cancelDelete = () => {
    setIsConfirmationOpen(false);
    setEventToDelete(null);
  };

  const showNotification = (message, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  const formatDate = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getHolidayForDate = (year, month, day) => {
    const holiday = staticHolidays.find(h => h.month === month && h.day === day);
    if (holiday) {
      return { ...holiday, date: formatDate(year, month, day), type: "holiday" };
    }
    return null;
  };

  const getEventOrHoliday = (dateStr) => {
    if (!dateStr) return { event: null, holiday: null };
    const [year, month, day] = dateStr.split('-').map(Number);
    const event = events.find(item => item.date === dateStr);
    const holiday = getHolidayForDate(year, month - 1, day);
    return { event, holiday };
  };

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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <AdminHeader/>
      <div className="content-container">
        <div className="page-header">
            <h1>School Calendar Management</h1>
            <p>View and manage school events, holidays, and important dates</p>
            </div>
      </div>
      <div className="calendar-container admin-calendar">
        
        {loading && <div className="loading-overlay">Loading...</div>}

        <div className="calendar-header">
          <button onClick={prevYear} disabled={currentYear === initialYear}>❮ Prev Year</button>
          <h2>{currentYear}</h2>
          <button onClick={nextYear} disabled={currentYear > initialYear}>Next Year ❯</button>   
        </div>

        {currentEvent && (
          <div className="current-event">
            <h3>Current Event: {currentEvent.name}</h3>
          </div>
        )}

        <div className="full-year-calendar">
          {monthNames.map((monthName, monthIndex) => {
            const daysInMonth = getDaysInMonth(currentYear, monthIndex);
            const firstDay = getFirstDayOfMonth(currentYear, monthIndex);
            
            return (
              <div key={monthName} className="calendar-month">
                <h3>{monthName} {currentYear}</h3>
                <table>
                  <thead>
                    <tr>
                      {dayNames.map(day => <th key={day}>{day}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, week) => (
                      <tr key={week}>
                        {Array.from({ length: 7 }).map((_, day) => {
                          const dateNumber = week * 7 + day - firstDay + 1;
                          const isValidDate = dateNumber > 0 && dateNumber <= daysInMonth;
                          const dateStr = isValidDate ? formatDate(currentYear, monthIndex, dateNumber) : "";
                          const { event, holiday } = getEventOrHoliday(dateStr);
                          const isTodayDate = dateStr === today;
                          
                          let className = '';
                          if (isTodayDate) className = 'today';
                          else if (event) className = 'event-day';
                          else if (holiday) className = 'holiday-day';
                          
                          const tooltipText = (event?.name && holiday?.title) 
                            ? `${event.name} & ${holiday.title}` 
                            : event?.name || holiday?.title || '';
                          
                          return (
                            <td
                              key={day}
                              className={className}
                              onClick={() => {
                                if (!isValidDate) return;
                                if (event) openEditModal(event);
                                else if (!holiday) openAddModal(dateStr);
                              }}
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
          <h3>Upcoming Events</h3>
          {events.length === 0 ? (
            <div className="empty-message">No events scheduled</div>
          ) : (
            <ul>
              {events
                .filter(event => {
                  const eventDate = new Date(event.date);
                  return eventDate >= new Date() && eventDate.getFullYear() === currentYear;
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((event, index) => {
                  const dateObj = new Date(event.date);
                  return (
                    <li key={index} className="event-item">
                      <div className="event-info">
                        <span className="event-date">{monthNames[dateObj.getMonth()]} {dateObj.getDate()}</span>
                        <span className="event-name">{event.name}</span>
                      </div>
                      <div className="item-actions">
                        <button onClick={() => openEditModal(event)} className="edit-button">Edit</button>
                        <button onClick={() => confirmDelete(event)} className="delete-button">Delete</button>
                      </div>
                    </li>
                  );
                })
              }
            </ul>
          )}
        </div>

        <div className="events-section">
          <h3>Upcoming Holidays</h3>
          {getUpcomingHolidays().length === 0 ? (
            <div className="empty-message">No upcoming holidays</div>
          ) : (
            <ul>
              {getUpcomingHolidays().map((holiday, index) => {
                const dateObj = new Date(holiday.date);
                return (
                  <li key={index} className="holiday-item">
                    <div className="holiday-info">
                      <span className="holiday-date">{monthNames[dateObj.getMonth()]} {dateObj.getDate()}</span>
                      <span className="holiday-name">{holiday.title}</span>
                    </div>
                    <div className="fixed-label">Fixed</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-header">{action === 'add' ? 'Add New Event' : 'Edit Event'}</h2>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="form-input"/>
              </div>
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input type="text" value={newEventName} onChange={(e) => setNewEventName(e.target.value)} className="form-input" placeholder="Enter event name"/>
              </div>
              <div className="modal-actions">
                <button onClick={closeModal} className="cancel-button">Cancel</button>
                {action === 'edit' && currentEvent && (
                  <button onClick={() => confirmDelete(currentEvent)} className="delete-button">Delete Event</button>
                )}
                <button onClick={action === 'add' ? addEvent : updateEvent} className="submit-button">
                  {action === 'add' ? 'Add Event' : 'Update Event'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {isConfirmationOpen && (
          <div className="modal-overlay">
            <div className="modal-content confirmation-modal">
              <h2 className="modal-header warning">Confirm Deletion</h2>
              <div className="confirmation-message">
                <p>Are you sure you want to delete this event?</p>
                <p className="warning-text">This action cannot be undone.</p>
                {eventToDelete && (
                  <div className="event-to-delete">
                    <p><strong>Event:</strong> {eventToDelete.name}</p>
                    <p><strong>Date:</strong> {new Date(eventToDelete.date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button onClick={cancelDelete} className="cancel-button">Cancel</button>
                <button onClick={performDelete} className="delete-button confirm-delete">Yes, Delete Event</button>
              </div>
            </div>
          </div>
        )}

        {tooltip.visible && (
          <div className="tooltip visible" style={{ position: "absolute", left: `${tooltip.x}px`, top: `${tooltip.y}px` }}>
            {tooltip.text}
          </div>
        )}

        {notification && (
          <div className={`notification ${notification.isError ? 'error' : 'success'}`}>
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCalendar;