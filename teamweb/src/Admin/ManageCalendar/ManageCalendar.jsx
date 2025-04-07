import React, { useState, useEffect } from 'react';
import './ManageCalendar.css';
import AdminHeader from '../Component/AdminHeader.jsx';

// Main Calendar component
const ManageCalendar = () => {
  const initialYear = new Date().getFullYear(); // Get the current year dynamically
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [hasSeenInitialYear, setHasSeenInitialYear] = useState(false);
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventName, setNewEventName] = useState('');
  const [action, setAction] = useState('add'); // 'add' or 'edit'
  const [notification, setNotification] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });
  // Add today's date for reference
  const [today, setToday] = useState('');
  // Add confirmation modal state
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [username, setUsername] = useState("");

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
    { title: "Eid'l Fitr", month: 3, day: 10 }, // Approximate, based on lunar calendar
    { title: "Eid'l Adha", month: 5, day: 20 }, // Approximate, based on lunar calendar
  
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
    const loggedInUser = localStorage.getItem('username');
    if (loggedInUser) {
        setUsername(loggedInUser);
    } else {
        setUsername("Admin");
    }

    // Set today's date in ISO format (YYYY-MM-DD)
    setToday(new Date().toISOString().split('T')[0]);

    const fetchCalendarData = async () => {
        try {
            const response = await fetch('https://teamweb-kera.onrender.com/calendar'); // Adjust API URL if needed
            if (!response.ok) throw new Error('Failed to fetch data');

            const data = await response.json();
            
            // Extract only events from the calendar data (not holidays)
            const eventsData = data.calendar ? data.calendar.filter(item => item.type === "event") : [];
            
            // Format data to match the existing structure
            const formattedEvents = eventsData.map(item => ({
                id: item._id,
                date: item.date.slice(0, 10),
                name: item.title
            }));
            
            setEvents(formattedEvents);
        } catch (error) {
            console.error('Error fetching calendar data:', error);
            setNotification({ message: 'Failed to load calendar data.', isError: true });
        }
    };

    // Function to delete previous year's entries
    const deletePreviousYearEntries = async () => {
      try {
          const response = await fetch('https://teamweb-kera.onrender.com/calendar/delete-previous-year', {
              method: 'DELETE',
          });
  
          if (response.status === 404) {
              console.log("No data found from last year to delete.");
              //return; // Exit early to avoid unnecessary error logging
          }
  
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to delete previous year’s entries');
          }
  
          const data = await response.json();
          console.log(data.message || "Previous year's calendar entries deleted successfully.");
      } catch (error) {
          console.error('Error deleting previous year’s calendar entries:', error.message);
      }
  };
  
  

    fetchCalendarData();
    deletePreviousYearEntries(); // Call the function when the component mounts
}, []);

  
  // Navigation functions
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

  // Modal handling
  const openAddModal = (date) => {
    setCurrentEvent(null); // Ensure currentEvent is null for add mode
    setNewEventDate(date);
    setNewEventName('');
    setAction('add');
    setIsModalOpen(true);
  };

  const openEditModal = (event) => {
    if (!event || !event.id) {
      // If no valid event data, fall back to add mode
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

  // Tooltip handling
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

  // Event management
  const addEvent = async () => {
      if (newEventName.trim() === '') return;

      const newEvent = { date: newEventDate, title: newEventName.trim(), type: "event" };

      try {
          const response = await fetch('https://teamweb-kera.onrender.com/calendar/add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newEvent),
          });

          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to add event: ${errorText}`);
          }

          const responseData = await response.json();
          
          setEvents([...events, {
              id: responseData.id,
              date: newEventDate,
              name: newEventName.trim()
          }]);

          // ✅ Call `/add-report` API
          await fetch("https://teamweb-kera.onrender.com/report/add-report", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  username: username, // Replace with actual username
                  activityLog: `[Manage Calendar] Added Event: ${newEventName.trim()} on ${newEventDate}`
              }),
          });

          closeModal();
          showNotification('Event added successfully!');
      } catch (error) {
          console.error('Error adding event:', error);
          showNotification('Failed to add event.', true);
      }
  };

  
  const updateEvent = async () => {
      if (newEventName.trim() === '' || !currentEvent) return;

      try {
          const response = await fetch(`https://teamweb-kera.onrender.com/calendar/edit/${currentEvent.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  date: newEventDate, 
                  title: newEventName,
                  type: "event"
              }),
          });

          if (!response.ok) throw new Error('Failed to update event');

          const updatedEvents = events.map((event) =>
              event.id === currentEvent.id ? { ...event, date: newEventDate, name: newEventName } : event
          );

          setEvents(updatedEvents);

          // ✅ Determine what changed and log accordingly
          let activityLog = "";
          if (currentEvent.name !== newEventName.trim() && currentEvent.date !== newEventDate) {
              activityLog = `[Manage Calendar] Updated Event: Name changed from '${currentEvent.name}' to '${newEventName.trim()}' and Date changed from '${currentEvent.date}' to '${newEventDate}'`;
          } else if (currentEvent.name !== newEventName.trim()) {
              activityLog = `[Manage Calendar] Updated Event: Name changed from '${currentEvent.name}' to '${newEventName.trim()}'`;
          } else if (currentEvent.date !== newEventDate) {
              activityLog = `[Manage Calendar] Updated Event: Date changed from '${currentEvent.date}' to '${newEventDate}'`;
          }

          if (activityLog) {
              await fetch("https://teamweb-kera.onrender.com/report/add-report", {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                      username: username, // Replace with actual username
                      activityLog: activityLog
                  }),
              });
          }

          closeModal();
          showNotification('Event updated successfully!');
      } catch (error) {
          console.error('Error updating event:', error);
          showNotification('Failed to update event.', true);
      }
  };


  
  // Show confirmation dialog before deleting
  const confirmDelete = (eventToDelete) => {
    if (!eventToDelete?.id) {
      console.error('Error: Missing event ID', eventToDelete);
      return;
    }
    
    setEventToDelete(eventToDelete);
    setIsConfirmationOpen(true);
  };
  
  // Proceed with deletion after confirmation
  const performDelete = async () => {
      if (!eventToDelete?.id) return;

      try {
          const response = await fetch(`https://teamweb-kera.onrender.com/calendar/delete/${eventToDelete.id}`, {
              method: 'DELETE',
          });

          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to delete event: ${errorText}`);
          }

          // Remove the deleted event from state
          const updatedEvents = events.filter((event) => event.id !== eventToDelete.id);
          setEvents(updatedEvents);
          closeModal(); // Close modal if deleting from the edit modal
          setIsConfirmationOpen(false); // Close confirmation dialog
          setEventToDelete(null);
          showNotification('Event deleted successfully!');

          // ✅ Call `/add-report` API
          await fetch("https://teamweb-kera.onrender.com/report/add-report", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  username: username, // Replace with actual username
                  activityLog: `[Manage Calendar] Deleted Event: '${eventToDelete.name}' on '${eventToDelete.date}'`
              }),
          });

      } catch (error) {
          console.error('Error deleting event:', error);
          showNotification('Failed to delete event.', true);
          setIsConfirmationOpen(false);
          setEventToDelete(null);
      }
  };

  
  // Cancel deletion
  const cancelDelete = () => {
    setIsConfirmationOpen(false);
    setEventToDelete(null);
  };

  // Notification handling
  const showNotification = (message, isError = false) => {
    setNotification({ message, isError });

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Calendar generation functions
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Get holiday data for a specific date
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
    const event = events.find(item => item.date === dateStr);
    const holiday = getHolidayForDate(year, month - 1, day); // month - 1 because months are 0-indexed in our static data
    
    return { event, holiday };
  };

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

  // Month and day names
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
      <div className="calendar-header">
        <button onClick={prevYear} disabled={currentYear === initialYear}>❮ Prev Year</button>
        <h2>{currentYear}</h2>
        <button onClick={nextYear} disabled={currentYear > initialYear}>Next Year ❯</button>   
      </div>

        {/* Current event display */}
        {currentEvent && (
          <div className="current-event">
            <h3>Current Event: {currentEvent.name}</h3>
          </div>
        )}

        {/* Calendar grid */}
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
                      {dayNames.map(day => (
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
                                
                                if (event) {
                                  openEditModal(event);
                                } else if (!holiday) {
                                  openAddModal(dateStr);
                                }
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

        {/* Upcoming events section */}
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
                  const monthName = monthNames[dateObj.getMonth()];
                  const day = dateObj.getDate();
                  
                  return (
                    <li key={index} className="event-item">
                      <div className="event-info">
                        <span className="event-date">{monthName} {day}</span>
                        <span className="event-name">{event.name}</span>
                      </div>
                      <div className="item-actions">
                        <button 
                          onClick={() => openEditModal(event)}
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => confirmDelete(event)}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })
              }
            </ul>
          )}
        </div>

        {/* Upcoming holidays section */}
        <div className="events-section">
          <h3>Upcoming Holidays</h3>
          {getUpcomingHolidays().length === 0 ? (
            <div className="empty-message">No upcoming holidays</div>
          ) : (
            <ul>
              {getUpcomingHolidays().map((holiday, index) => {
                const dateObj = new Date(holiday.date);
                const monthName = monthNames[dateObj.getMonth()];
                const day = dateObj.getDate();
                
                return (
                  <li key={index} className="holiday-item">
                    <div className="holiday-info">
                      <span className="holiday-date">{monthName} {day}</span>
                      <span className="holiday-name">{holiday.title}</span>
                    </div>
                    <div className="fixed-label">Fixed</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Modal for adding/editing events */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-header">
                {action === 'add' ? 'Add New Event' : 'Edit Event'}
              </h2>
              
              <div className="form-group">
                <label className="form-label">Date</label>
                <input 
                  type="date" 
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input 
                  type="text" 
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="form-input"
                  placeholder="Enter event name"
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  onClick={closeModal}
                  className="cancel-button"
                >
                  Cancel
                </button>
                
                {action === 'edit' && currentEvent && (
                  <button 
                    onClick={() => confirmDelete(currentEvent)}
                    className="delete-button"
                  >
                    Delete Event
                  </button>
                )}
                
                <button 
                  onClick={action === 'add' ? addEvent : updateEvent}
                  className="submit-button"
                >
                  {action === 'add' ? 'Add Event' : 'Update Event'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Confirmation Dialog for Delete */}
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
                <button 
                  onClick={cancelDelete}
                  className="cancel-button"
                >
                  Cancel
                </button>
                
                <button 
                  onClick={performDelete}
                  className="delete-button confirm-delete"
                >
                  Yes, Delete Event
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tooltip */}
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

        {/* Notification */}
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