import CalendarComponent from '../../components/Calendar/CalendarComponent';
import './Calendar.css';

export default function CalendarPage({ events }) {
  return (
    <div className='p-3'>
      <CalendarComponent events={events}/>
    </div>
  );
}