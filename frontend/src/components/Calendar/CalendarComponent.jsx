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

    const handleNavigate = (newDate) => {
        setDate(newDate);
    };

    const handleView = (newView) => {
        setView(newView);
    };

    return (
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                date={date}
                onNavigate={handleNavigate}
                onView={handleView}
                className="min-vh-100"
            />
    )
}