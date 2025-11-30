import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import './TaskModal.css';

export default function TaskModal({ show, onHide, task, slot, onSave }) {
    const { fetchWithAuth, API_URL } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        start: '',
        end: '',
        points: '',
        recurring: false
    });
    const [calculatedPoints, setCalculatedPoints] = useState(1);

    useEffect(() => {
        if (task) {
            // Editing existing task
            setFormData({
                title: task.title || '',
                start: formatDateTimeLocal(task.start),
                end: formatDateTimeLocal(task.end),
                points: task.points || '',
                recurring: task.recurring || false
            });
        } else if (slot) {
            // Creating new task
            setFormData({
                title: '',
                start: formatDateTimeLocal(slot.start),
                end: formatDateTimeLocal(slot.end),
                points: '',
                recurring: false
            });
        }
    }, [task, slot, show]);

    // Calculate points based on duration
    useEffect(() => {
        if (formData.start && formData.end) {
            const start = new Date(formData.start);
            const end = new Date(formData.end);
            const durationMs = end - start;
            const durationMinutes = durationMs / (1000 * 60);
            const points = Math.max(1, Math.round(durationMinutes / 30));
            setCalculatedPoints(points);
        }
    }, [formData.start, formData.end]);

    const formatDateTimeLocal = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const start = new Date(formData.start);
        const end = new Date(formData.end);
        const durationMinutes = (end - start) / (1000 * 60);

        const taskData = {
            title: formData.title,
            start: start.toISOString(),
            end: end.toISOString(),
            duration_minutes: durationMinutes,
            points: formData.points ? parseFloat(formData.points) : calculatedPoints,
            recurring: formData.recurring
        };

        try {
            if (task) {
                // Update existing task
                await fetchWithAuth(`${API_URL}/api/tasks/${task._id}`, {
                    method: 'PUT',
                    body: JSON.stringify(taskData)
                });
            } else {
                // Create new task
                await fetchWithAuth(`${API_URL}/api/tasks`, {
                    method: 'POST',
                    body: JSON.stringify(taskData)
                });
            }
            onSave();
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Failed to save task');
        }
    };

    const handleDelete = async () => {
        if (!task || !window.confirm('Are you sure you want to delete this task?')) return;

        try {
            await fetchWithAuth(`${API_URL}/api/tasks/${task._id}`, {
                method: 'DELETE'
            });
            onSave();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task');
        }
    };

    const handleComplete = async () => {
        if (!task || task.completed) return;

        try {
            const response = await fetchWithAuth(`${API_URL}/api/tasks/${task._id}/complete`, {
                method: 'POST'
            });
            const data = await response.json();

            alert(`Task completed! You earned ${data.points_earned} points! Total: ${data.total_points}`);
            onSave();
        } catch (error) {
            console.error('Error completing task:', error);
            alert('Failed to complete task');
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered className="task-modal">
            <Modal.Header closeButton>
                <Modal.Title>{task ? 'Edit Task' : 'Create Task'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Task Title</Form.Label>
                        <Form.Control
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter task title"
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Start Time</Form.Label>
                        <Form.Control
                            type="datetime-local"
                            name="start"
                            value={formData.start}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>End Time</Form.Label>
                        <Form.Control
                            type="datetime-local"
                            name="end"
                            value={formData.end}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>
                            Points (Default: {calculatedPoints} based on duration)
                        </Form.Label>
                        <Form.Control
                            type="number"
                            name="points"
                            value={formData.points}
                            onChange={handleChange}
                            placeholder={`Auto: ${calculatedPoints} points`}
                            min="0"
                            step="0.5"
                        />
                        <Form.Text className="text-muted">
                            Leave blank for auto-calculation (30 min = 1 point)
                        </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Check
                            type="checkbox"
                            name="recurring"
                            label="Recurring (daily)"
                            checked={formData.recurring}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <div className="button-container">
                        {task && !task.completed && (
                            <div className="complete-section">
                                <Button variant="success" onClick={handleComplete}>
                                    ✓ Complete Task
                                </Button>
                            </div>
                        )}
                        {task && task.completed && (
                            <div className="complete-section">
                                <span className="text-success fw-bold">✓ Completed</span>
                            </div>
                        )}
                        <div className="button-group">
                            {task && (
                                <Button variant="danger" onClick={handleDelete}>
                                    Delete
                                </Button>
                            )}
                            <Button variant="secondary" onClick={onHide}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                {task ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}