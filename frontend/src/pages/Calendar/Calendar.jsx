import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, getDay, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import TaskModal from '../../components/TaskModal/TaskModal';
import './Calendar.css';

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
            end: new Date(2025, 11, 25, 0, 0),
            isHoliday: true
        },
        {
            title: 'Christmas Day',
            start: new Date(2025, 11, 25, 0, 0),
            end: new Date(2025, 11, 26, 0, 0),
            isHoliday: true
        },
        {
            title: "New Year's Eve",
            start: new Date(2025, 11, 31, 0, 0),
            end: new Date(2026, 0, 1, 0, 0),
            isHoliday: true
        },
        {
            title: "New Year's Day",
            start: new Date(2026, 0, 1, 0, 0),
            end: new Date(2026, 0, 2, 0, 0),
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
                    color: 'black',
                    border: 'none',
                    opacity: 0.8
                }
            };
        }

        if (event.completed) {
            return {
                style: {
                    backgroundColor: '#72d6b5ff',
                    color: 'white',
                    border: 'none',
                    textDecoration: 'line-through'
                }
            };
        }

        // Generate random color for each task based on task ID
        const colors = [
            '#7986cb', // Indigo
            '#9c6edc', // Purple
            '#f06292', // Pink
            '#ffb300', // Amber
            '#66bb6a', // Emerald
            '#4fc3f7', // Cyan
            '#64b5f6', // Blue
            '#f06292', // Rose
            '#9c6edc', // Violet
            '#66c8b1'  // Teal

        ];

        // Use task ID to consistently assign same color to same task
        const colorIndex = event._id ?
            event._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
            : Math.floor(Math.random() * colors.length);

        return {
            style: {
                backgroundColor: colors[colorIndex],
                color: 'black',
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