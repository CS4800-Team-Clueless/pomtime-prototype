import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, getDay, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale'
import './CalendarComponent.css';

const locales = {
    'en-US': enUS
}

const localizer = dateFnsLocalizer ({
    format,
    parse,
    getDay,
    startOfWeek,
    locales
})

export default function CalendarComponent({ events }) {

    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    // Temporary holiday events
    const holiday_events = [
        {
            title: 'Halloween',
            start: new Date(2025, 9, 31, 0, 0),
            end: new Date(2025, 9, 31, 11, 59)
        },
        {
            title: 'Christmas Eve',
            start: new Date(2025, 11, 24, 0, 0),
            end: new Date(2025, 11, 24, 11, 59)
        },
        {
            title: 'Christmas Day',
            start: new Date(2025, 11, 25, 0, 0),
            end: new Date(2025, 11, 25, 11, 59)
        },
        {
            title: 'New Year\'s Eve',
            start: new Date(2025, 11, 31, 0, 0),
            end: new Date(2025, 11, 31, 11, 59)
        },
        {
            title: 'New Year\'s Day',
            start: new Date(2026, 0, 1, 0, 0),
            end: new Date(2026, 0, 1, 11, 59)
        }
    ];

    const handleNavigate = (newDate) => {
        setDate(newDate);
    };

    const handleView = (newView) => {
        setView(newView);
    };

    const allEvents = [...(events || []), ...holiday_events];

    return (
        <Calendar
            localizer={localizer}
            events={allEvents}
            startAccessor="start"
            endAccessor="end"
            view={view}
            date={date}
            onNavigate={handleNavigate}
            onView={handleView}
            className="min-vh-100"
        />
    );
}