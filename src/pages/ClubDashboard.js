import React, { useEffect, useState } from 'react';
import ClubNavigation from '../components/ClubNavigation';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { isEventArchived } from '../utils/eventArchiver';
import { Container, Card, Button, Form, Table, ProgressBar, Row, Col, Badge, Modal, Alert } from 'react-bootstrap';
import Carousel from 'react-bootstrap/Carousel';

export default function ClubDashboard() {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [attendeesInfo, setAttendeesInfo] = useState({});
  const [followers, setFollowers] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [eventFilter, setEventFilter] = useState('active'); // 'active' or 'archived'
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchEvents = async () => {
      if (!currentUser) return;
      setLoadingEvents(true);
      try {
        const q = query(collection(db, 'events'), where('clubId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const eventList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventList);
        const attendeesData = {};
        for (const event of eventList) {
          if (Array.isArray(event.attendees) && event.attendees.length > 0) {
            const users = await Promise.all(event.attendees.map(async (uid) => {
              const userDoc = await getDoc(doc(db, 'users', uid));
              if (userDoc.exists()) {
                const data = userDoc.data();
                return { email: data.email, major: data.major || 'N/A' };
              } else {
                return { email: 'Unknown', major: 'N/A' };
              }
            }));
            attendeesData[event.id] = users;
          } else {
            attendeesData[event.id] = [];
          }
        }
        setAttendeesInfo(attendeesData);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
      setLoadingEvents(false);
    };
    fetchEvents();
  }, [currentUser]);

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!currentUser) return;
      setLoadingFollowers(true);
      try {
        const clubDocRef = doc(db, 'clubs', currentUser.uid);
        const clubDocSnap = await getDoc(clubDocRef);
        if (clubDocSnap.exists()) {
          const data = clubDocSnap.data();
          const followerIds = Array.isArray(data.followers) ? data.followers : [];
          const followerData = await Promise.all(followerIds.map(async (uid) => {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              const user = userDoc.data();
              return { email: user.email, major: user.major || 'N/A' };
            } else {
              return { email: 'Unknown', major: 'N/A' };
            }
          }));
          setFollowers(followerData);
        } else {
          setFollowers([]);
        }
      } catch (err) {
        console.error('Error fetching followers:', err);
        setFollowers([]);
      }
      setLoadingFollowers(false);
    };
    fetchFollowers();
  }, [currentUser]);

  const handleDeleteEvent = (event) => {
    setEventToDelete(event);
    setDeleteModalShow(true);
    setDeleteError('');
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    setDeleteLoading(true);
    setDeleteError('');
    
    try {
      await deleteDoc(doc(db, 'events', eventToDelete.id));
      
      // Remove the event from local state
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventToDelete.id));
      
      // Remove attendees info for this event
      setAttendeesInfo(prev => {
        const newAttendeesInfo = { ...prev };
        delete newAttendeesInfo[eventToDelete.id];
        return newAttendeesInfo;
      });
      
      setDeleteModalShow(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      setDeleteError('Failed to delete event. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredEvents = events.filter(event => 
    eventFilter === 'active' ? !isEventArchived(event) : isEventArchived(event)
  );

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #f7f7fa 60%, #e5f0ff 100%)' }}>
      <ClubNavigation />
      <Container className="py-4" style={{ marginTop: '80px' }}>
        <Row className="g-4">
          {/* Event Dashboard (Left) */}
          <Col lg={8}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-primary text-white">
                <h2 className="mb-0 fw-bold">Event Dashboard</h2>
              </Card.Header>
              <Card.Body>
                {/* Filter Dropdown */}
                <div className="mb-4">
                  <Form.Label className="fw-bold">Show:</Form.Label>
                  <Form.Select
                    value={eventFilter}
                    onChange={e => setEventFilter(e.target.value)}
                    className="w-auto"
                  >
                    <option value="active">Active Events</option>
                    <option value="archived">Archived Events</option>
                  </Form.Select>
                </div>

                {loadingEvents ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading events...</p>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted">No {eventFilter} events found.</p>
                  </div>
                ) : (
                  <div>
                    {filteredEvents.map(event => (
                      <Card key={event.id} className="mb-3 border-start border-primary border-4">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <Card.Title className="mb-0 text-primary fw-bold">
                              {event.eventName || 'Untitled Event'}
                            </Card.Title>
                            <div className="d-flex gap-2 align-items-center">
                              <Badge bg="warning" text="dark">
                                Signups: {Array.isArray(event.attendees) ? event.attendees.length : 0}
                              </Badge>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteEvent(event)}
                              >
                                🗑️ Delete
                              </Button>
                            </div>
                          </div>
                          
                          <div className="row mb-3">
                            <div className="col-md-6">
                              <p className="text-muted mb-1">
                                <i className="bi bi-calendar me-2"></i>
                                {event.date}
                              </p>
                              <p className="text-muted mb-1">
                                <i className="bi bi-clock me-2"></i>
                                {event.startTime} - {event.endTime}
                              </p>
                            </div>
                            <div className="col-md-6">
                              <p className="text-muted mb-1">
                                <i className="bi bi-geo-alt me-2"></i>
                                {event.location}
                              </p>
                              <p className="text-muted mb-1">
                                <i className="bi bi-people me-2"></i>
                                {event.openTo === 'everyone' ? 'Open to Everyone' : 'Club Members Only'}
                              </p>
                            </div>
                          </div>

                          {event.description && (
                            <p className="text-muted mb-3">{event.description}</p>
                          )}

                          {Array.isArray(event.tags) && event.tags.length > 0 && (
                            <div className="mb-3">
                              {event.tags.map((tag, idx) => (
                                <Badge key={idx} bg="light" text="dark" className="me-1">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Attendees Table */}
                          {Array.isArray(attendeesInfo[event.id]) && attendeesInfo[event.id].length > 0 && (
                            <div className="mt-3">
                              <h6 className="fw-bold mb-2">Attendees ({attendeesInfo[event.id].length})</h6>
                              <Table striped bordered hover size="sm">
                                <thead>
                                  <tr>
                                    <th>Email</th>
                                    <th>Major</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {attendeesInfo[event.id].map((attendee, idx) => (
                                    <tr key={idx}>
                                      <td>{attendee.email}</td>
                                      <td>{attendee.major}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          )}

                          {Array.isArray(attendeesInfo[event.id]) && attendeesInfo[event.id].length === 0 && (
                            <p className="text-muted text-center py-3">
                              No attendees yet. Share this event to get signups!
                            </p>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Statistics Dashboard (Right) */}
          <Col lg={4}>
            {/* Followers Card */}
            <Card className="shadow-sm border-0 mb-4">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0 fw-bold">Followers</h5>
              </Card.Header>
              <Card.Body>
                {loadingFollowers ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h3 className="mb-0 text-success fw-bold">{followers.length}</h3>
                      <Badge bg="success" className="px-2 py-1">
                        Total Followers
                      </Badge>
                    </div>
                    
                    {followers.length > 0 ? (
                      <div>
                        <h6 className="fw-bold mb-2">Recent Followers</h6>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {followers.slice(0, 5).map((follower, idx) => (
                            <div key={idx} className="d-flex align-items-center mb-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                style={{ 
                                  width: '35px', 
                                  height: '35px', 
                                  backgroundColor: '#198754',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '14px'
                                }}
                              >
                                {follower.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-grow-1">
                                <div className="fw-bold" style={{ fontSize: '14px' }}>{follower.email}</div>
                                <small className="text-muted">{follower.major}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                        {followers.length > 5 && (
                          <p className="text-muted text-center mb-0 mt-2">
                            +{followers.length - 5} more followers
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted text-center mb-0">
                        No followers yet. Start promoting your club!
                      </p>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Event Statistics */}
            <Card className="shadow-sm border-0 mb-4">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0 fw-bold">Event Statistics</h5>
              </Card.Header>
              <Card.Body>
                <div className="row text-center">
                  <div className="col-6 mb-3">
                    <div className="fw-bold text-info" style={{ fontSize: '2rem' }}>
                      {filteredEvents.length}
                    </div>
                    <small className="text-muted">
                      {eventFilter === 'active' ? 'Active' : 'Archived'} Events
                    </small>
                  </div>
                  <div className="col-6 mb-3">
                    <div className="fw-bold text-success" style={{ fontSize: '2rem' }}>
                      {Object.values(attendeesInfo).reduce((total, attendees) => 
                        total + (Array.isArray(attendees) ? attendees.length : 0), 0
                      )}
                    </div>
                    <small className="text-muted">Total Signups</small>
                  </div>
                </div>
                
                {/* Average Attendance */}
                {filteredEvents.length > 0 && (
                  <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold">Average Attendance</span>
                      <span className="text-muted">
                        {Math.round(
                          Object.values(attendeesInfo).reduce((total, attendees) => 
                            total + (Array.isArray(attendees) ? attendees.length : 0), 0
                          ) / filteredEvents.length
                        )}
                      </span>
                    </div>
                    <ProgressBar 
                      variant="info" 
                      now={
                        (Object.values(attendeesInfo).reduce((total, attendees) => 
                          total + (Array.isArray(attendees) ? attendees.length : 0), 0
                        ) / filteredEvents.length) / 10 * 100
                      } 
                      style={{ height: '8px' }}
                    />
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-warning text-dark">
                <h5 className="mb-0 fw-bold">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button variant="primary" size="lg" href="/create-event">
                    ➕ Create New Event
                  </Button>
                  <Button variant="outline-secondary" size="lg" href="/club-profile">
                    ✏️ Edit Profile
                  </Button>
                  <Button variant="outline-info" size="lg" href="/club-event-calendar">
                    📅 View Calendar
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Delete Event Confirmation Modal */}
      <Modal show={deleteModalShow} onHide={() => setDeleteModalShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Event Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the event <strong>"{eventToDelete?.eventName}"</strong>?</p>
          <p className="text-danger">
            <strong>Warning:</strong> This action cannot be undone. All attendee information will be permanently lost.
          </p>
          {deleteError && (
            <Alert variant="danger" className="mt-3">
              {deleteError}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModalShow(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDeleteEvent}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Deleting...
              </>
            ) : (
              'Delete Event'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}