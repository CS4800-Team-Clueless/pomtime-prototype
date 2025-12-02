import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import './TaskModal.css';

export default function TaskModal({ show, onHide, task, slot, onSave }) {
    const { fetchWithAuth, API_URL } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        start: '',
        end: '',
        recurring: false
    });
    const [calculatedPoints, setCalculatedPoints] = useState(1);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (task) {
            // Editing existing task
            setFormData({
                title: task.title || '',
                start: formatDateTimeLocal(task.start),
                end: formatDateTimeLocal(task.end),
                recurring: task.recurring || false
            });
        } else if (slot) {
            // Creating new task
            setFormData({
                title: '',
                start: formatDateTimeLocal(slot.start),
                end: formatDateTimeLocal(slot.end),
                recurring: false
            });
        }
        // Reset states when modal opens/closes
        setShowDeleteConfirm(false);
        setShowSuccessMessage(false);
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
            points: calculatedPoints, // Always use calculated points
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
        if (!task) return;

        try {
            await fetchWithAuth(`${API_URL}/api/tasks/${task._id}`, {
                method: 'DELETE'
            });
            setShowDeleteConfirm(false);
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

            setSuccessMessage(`Task completed! You earned ${data.points_earned} points! Total: ${data.total_points}`);
            setShowSuccessMessage(true);

            setTimeout(() => {
                onSave();
            }, 2000);
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
                {showSuccessMessage && (
                    <Alert variant="success" className="mb-3">
                        {successMessage}
                    </Alert>
                )}

                {showDeleteConfirm ? (
                    <div className="delete-confirmation">
                        <Alert variant="danger">
                            <Alert.Heading>Delete Task?</Alert.Heading>
                            <p>Are you sure you want to delete "{task?.title}"? This action cannot be undone.</p>
                            <div className="d-flex gap-2 justify-content-end mt-3">
                                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                                    Cancel
                                </Button>
                                <Button variant="danger" onClick={handleDelete}>
                                    Delete Permanently
                                </Button>
                            </div>
                        </Alert>
                    </div>
                ) : (
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

                        <div className="points-alert mb-3">
                            <div className="points-earn-label">You can earn:</div>
                                <div className="points-value">{calculatedPoints}🦴 Pom Treats</div>
                                <div className="points-label"></div>
                            <small className="calc-info">Every 30 minutes = 1 Pom Treat</small>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                name="recurring"
                                label="Recurring (daily)"
                                checked={formData.recurring}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <div className="task-modal-actions">
                            {task && !task.completed && (
                                <Button variant="success" onClick={handleComplete} className="complete-btn">
                                    ✓ Complete Task
                                </Button>
                            )}
                            {task && task.completed && (
                                <span className="text-success fw-bold completed-badge">✓ Completed</span>
                            )}
                            <div className="action-buttons">
                                {task && (
                                    <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
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
                )}
            </Modal.Body>
        </Modal>
    );
}