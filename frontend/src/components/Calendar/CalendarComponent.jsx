import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, getDay, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import TaskModal from '../../components/TaskModal/TaskModal';
import './CalendarComponent.css';

const locales = {
    'en-US': enUS
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    getDay,
    startOfWeek,
    locales
});

export default function CalendarPage() {
    const { fetchWithAuth, API_URL } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Temporary holiday events
    const holiday_events = [
        {
            title: 'Halloween',
            start: new Date(2025, 9, 31, 0, 0),
            end: new Date(2025, 9, 31, 23, 59),
            isHoliday: true
        },
        {
            title: 'Christmas Eve',
            start: new Date(2025, 11, 24, 0, 0),
            end: new Date(2025, 11, 24, 23, 59),
            isHoliday: true
        },
        {
            title: 'Christmas Day',
            start: new Date(2025, 11, 25, 0, 0),
            end: new Date(2025, 11, 25, 23, 59),
            isHoliday: true
        },
        {
            title: "New Year's Eve",
            start: new Date(2025, 11, 31, 0, 0),
            end: new Date(2025, 11, 31, 23, 59),
            isHoliday: true
        },
        {
            title: "New Year's Day",
            start: new Date(2026, 0, 1, 0, 0),
            end: new Date(2026, 0, 1, 23, 59),
            isHoliday: true
        }
    ];

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await fetchWithAuth(`${API_URL}/api/tasks`);
            const data = await response.json();

            // Convert task dates from strings to Date objects
            const formattedTasks = data.tasks.map(task => ({
                ...task,
                start: new Date(task.start),
                end: new Date(task.end),
                title: task.title
            }));

            setTasks(formattedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const handleSelectSlot = ({ start, end }) => {
        setSelectedSlot({ start, end });
        setSelectedTask(null);
        setShowModal(true);
    };

    const handleSelectEvent = (event) => {
        if (event.isHoliday) return; // Don't allow editing holidays
        setSelectedTask(event);
        setSelectedSlot(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedTask(null);
        setSelectedSlot(null);
    };

    const handleSaveTask = async () => {
        await fetchTasks();
        handleCloseModal();
    };

    const handleNavigate = (newDate) => {
        setDate(newDate);
    };

    const handleView = (newView) => {
        setView(newView);
    };

    // Custom event styling
    const eventStyleGetter = (event) => {
        if (event.isHoliday) {
            return {
                style: {
                    backgroundColor: '#fbbf24',
                    border: 'none',
                    opacity: 0.8
                }
            };
        }

        if (event.completed) {
            return {
                style: {
                    backgroundColor: '#10b981',
                    border: 'none',
                    textDecoration: 'line-through'
                }
            };
        }

        return {
            style: {
                backgroundColor: '#6366f1',
                border: 'none'
            }
        };
    };

    const allEvents = [...tasks, ...holiday_events];

    return (
        <div className="calendar-page">
            <div className="calendar-container">
                <Calendar
                    localizer={localizer}
                    events={allEvents}
                    startAccessor="start"
                    endAccessor="end"
                    view={view}
                    date={date}
                    onNavigate={handleNavigate}
                    onView={handleView}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    selectable
                    eventPropGetter={eventStyleGetter}
                    style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
                />
            </div>

            <TaskModal
                show={showModal}
                onHide={handleCloseModal}
                task={selectedTask}
                slot={selectedSlot}
                onSave={handleSaveTask}
            />
        </div>
    );
}