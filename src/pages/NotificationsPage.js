// pages/NotificationsPage.js
import React, { useState, useEffect } from 'react';
import StudentNavigation from "../components/StudentNavigation";
import { getEventsForStudent, auth, db } from '../firebase'; 
import { doc, getDoc, collection, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import availableTags from '../data/availableTags';
import { Container, Card, Button, Form, Row, Col, Badge, Alert, Image, Nav, Tab } from 'react-bootstrap';

export default function NotificationsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('forYou'); // 'forYou' or 'following'
  const [userTags, setUserTags] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [user, setUser] = useState(null);
  const [joinedClubs, setJoinedClubs] = useState([]);
  const [recommendedClubs, setRecommendedClubs] = useState([]);

  // Pastel color palette for tags
  const pastelColors = [
    '#ffe5e5', '#e5ffe5', '#e5f0ff', '#fffbe5', '#fff0e5', '#f3e5ff', '#ffe5f0', '#e5fff6', '#f5e5ff', '#e5fff0', '#f5ffe5', '#e5eaff', '#fff5e5', '#f0f0f0',
  ];
  const tagColorMap = availableTags.reduce((map, tag, idx) => {
    map[tag] = pastelColors[idx % pastelColors.length];
    return map;
  }, {});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchUserTagsAndClubs(user);
      } else {
        setUserTags([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserTagsAndClubs = async (currentUser) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      let tags = [];
      if (userSnap.exists()) {
        const data = userSnap.data();
        tags = Array.isArray(data.tags) ? data.tags.filter(tag => availableTags.includes(tag)) : [];
        setUserTags(tags);
        setJoinedClubs(Array.isArray(data.joinedClubs) ? data.joinedClubs : []);
      }
      const clubsSnapshot = await getDocs(collection(db, 'clubs'));
      const allClubs = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClubs(allClubs);
      
      // Generate club recommendations based on freshly fetched user tags
      generateClubRecommendations(allClubs, tags);
    } catch (error) {
      console.error('Error fetching user tags and clubs:', error);
    }
  };

  const generateClubRecommendations = (allClubs, userTags) => {
    if (!userTags || userTags.length === 0) {
      // If no user tags, recommend most popular clubs
      const recommendations = allClubs
        .filter(club => !joinedClubs.includes(club.name))
        .sort((a, b) => {
          const aFollowers = Array.isArray(a.followers) ? a.followers.length : (typeof a.followers === 'number' ? a.followers : 0);
          const bFollowers = Array.isArray(b.followers) ? b.followers.length : (typeof b.followers === 'number' ? b.followers : 0);
          return bFollowers - aFollowers;
        })
        .slice(0, 5);
      setRecommendedClubs(recommendations);
      return;
    }

    // Score clubs based on tag overlap with user interests and popularity
    const scoredClubs = allClubs
      .filter(club => !joinedClubs.includes(club.name))
      .map(club => {
        const clubTags = Array.isArray(club.tags) ? club.tags : [];
        const tagOverlap = userTags.filter(tag => clubTags.includes(tag)).length;
        const followersCount = Array.isArray(club.followers) ? club.followers.length : (typeof club.followers === 'number' ? club.followers : 0);
        const popularityScore = followersCount * 0.1;
        const tagScore = tagOverlap * 3; // Higher weight for tag matches
        const score = tagScore + popularityScore;
        return { ...club, score, tagOverlap };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setRecommendedClubs(scoredClubs);
  };

  useEffect(() => {
    if (!user) {
        setLoading(false);
        setEvents([]);
        return;
    };

    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Using the new function with the student's ID
        const eventList = await getEventsForStudent(user.uid);
        setEvents(eventList);
      } catch (err) {
        console.error("Error fetching events: ", err);
        setError('Failed to load notifications. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]); // Re-fetch when the user logs in/out

  const handleSignUp = async (eventId) => {
    if (!user) return;
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        attendees: arrayUnion(user.uid)
      });
      setEvents(prevEvents => prevEvents.map(ev =>
        ev.id === eventId
          ? { ...ev, attendees: Array.isArray(ev.attendees) ? [...ev.attendees, user.uid] : [user.uid] }
          : ev
      ));
    } catch (err) {
      alert('Failed to sign up for event.');
      console.error(err);
    }
  };

  const handleRemoveSignup = async (eventId) => {
    if (!user) return;
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        attendees: arrayRemove(user.uid)
      });
      setEvents(prevEvents => prevEvents.map(ev =>
        ev.id === eventId
          ? { ...ev, attendees: Array.isArray(ev.attendees) ? ev.attendees.filter(uid => uid !== user.uid) : [] }
          : ev
      ));
    } catch (err) {
      alert('Failed to remove signup.');
      console.error(err);
    }
  };

  const handleJoinClub = async (clubName) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      let joined = [];
      if (userSnap.exists()) {
        const data = userSnap.data();
        joined = Array.isArray(data.joinedClubs) ? data.joinedClubs : [];
      }
      if (!joined.includes(clubName)) {
        const updated = [...joined, clubName];
        await updateDoc(userRef, { joinedClubs: updated });
        setJoinedClubs(updated);
        // Update recommendations
        generateClubRecommendations(clubs, userTags);
      }
    } catch (error) {
      console.error('Error joining club:', error);
    }
  };

  // Filter events based on active tab
  const getFilteredEvents = () => {
    // First filter out test events
    const nonTestEvents = events.filter(event => {
      const eventName = event.eventName?.toLowerCase() || '';
      const description = event.description?.toLowerCase() || '';
      const clubName = event.clubName?.toLowerCase() || '';
      
      // Filter out test events
      return !eventName.includes('test') && 
             !eventName.includes('members only') &&
             !description.includes('test') &&
             !description.includes('members only') &&
             !clubName.includes('test');
    });

    if (activeTab === 'following') {
      // Show events from clubs the user follows
      return nonTestEvents.filter(event => 
        joinedClubs.includes(event.clubName)
      );
    } else {
      // Show events from clubs matching user interests
      const interestMatchingClubs = clubs.filter(club => {
        if (joinedClubs.includes(club.name)) return false; // Don't show clubs they already follow
        if (!userTags || userTags.length === 0) return true; // Show all if no interests
        const clubTags = Array.isArray(club.tags) ? club.tags : [];
        return userTags.some(tag => clubTags.includes(tag));
      }).map(club => club.name);

      return nonTestEvents.filter(event => 
        interestMatchingClubs.includes(event.clubName)
      );
    }
  };

  const filteredEvents = getFilteredEvents();

  const renderEventCard = (event) => {
    const alreadySignedUp = Array.isArray(event.attendees) && user && event.attendees.includes(user.uid);
    const attendeeCount = Array.isArray(event.attendees) ? event.attendees.length : 0;
    
    return (
      <Card key={event.id} className="mb-4 shadow-sm border-0" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Event Header */}
        <Card.Header className="bg-white border-0 pb-0">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: event.bgColor || '#003B5C',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                {event.clubName?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div>
                <div className="fw-bold text-dark">{event.clubName}</div>
                <small className="text-muted">{event.date} • {event.startTime}</small>
              </div>
            </div>
            <div className="dropdown">
              <Button variant="link" className="text-muted p-0">
                ⋯
              </Button>
            </div>
          </div>
        </Card.Header>

        {/* Event Image */}
        {event.bannerUrl && (
          <div className="position-relative">
            <Image 
              src={event.bannerUrl} 
              alt="Event Banner" 
              className="w-100"
              style={{ height: '300px', objectFit: 'cover' }}
            />
            <div className="position-absolute top-0 end-0 m-2">
              <Badge bg="primary" className="px-2 py-1">
                Public Event
              </Badge>
            </div>
          </div>
        )}

        {/* Event Content */}
        <Card.Body className="px-4 py-3">
          {/* Event Title */}
          <h5 className="fw-bold text-dark mb-2">{event.eventName}</h5>
          
          {/* Tags */}
          {Array.isArray(event.tags) && event.tags.length > 0 && (
            <div className="mb-3">
              {event.tags.map((tag, idx) => (
                <Badge 
                  key={idx} 
                  className="me-1 mb-1 px-2 py-1"
                  style={{ 
                    backgroundColor: tagColorMap[tag] || '#f8f9fa', 
                    color: '#003B5C',
                    fontSize: '12px'
                  }}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Event Details */}
          <div className="mb-3">
            <p className="text-muted mb-2" style={{ fontSize: '14px' }}>
              {event.description}
            </p>
            
            <div className="row text-muted" style={{ fontSize: '13px' }}>
              <div className="col-6">
                <i className="bi bi-geo-alt me-1"></i> {event.location}
              </div>
              <div className="col-6">
                <i className="bi bi-clock me-1"></i> {event.startTime} - {event.endTime}
              </div>
            </div>
            
            {event.zoomLink && (
              <div className="mt-2">
                <i className="bi bi-camera-video me-1"></i>
                <a href={event.zoomLink} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                  Join Zoom Meeting
                </a>
              </div>
            )}
          </div>

          {/* Attendees */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <small className="text-muted me-2">
                {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} attending
              </small>
            </div>
            <small className="text-muted">
              Open to everyone
            </small>
          </div>

          {/* Action Button */}
          <Button
            variant={alreadySignedUp ? "outline-danger" : "primary"}
            className="w-100"
            size="lg"
            onClick={() => {
              if (alreadySignedUp) {
                handleRemoveSignup(event.id);
              } else {
                handleSignUp(event.id);
              }
            }}
          >
            {alreadySignedUp ? '❌ Remove Signup' : '✅ Sign Up for Event'}
          </Button>
        </Card.Body>
      </Card>
    );
  };

  const renderClubRecommendation = (club) => {
    const firstTag = Array.isArray(club.tags) && club.tags.length > 0 ? club.tags[0] : 'General';
    const bgColor = tagColorMap[firstTag] || '#f8f9fa';
    const matchingTags = userTags.filter(tag => 
      Array.isArray(club.tags) && club.tags.includes(tag)
    );
    
    // Handle follower count display (supports array or number)
    const followerCount = Array.isArray(club.followers) 
      ? club.followers.length 
      : (typeof club.followers === 'number' ? club.followers : 0);
    const followerText = followerCount === 0 ? 'New club' : `${followerCount} follower${followerCount !== 1 ? 's' : ''}`;
    
    return (
      <div key={club.id} className="d-flex align-items-center mb-3 p-2 rounded" style={{ backgroundColor: bgColor }}>
        <div 
          className="rounded-circle d-flex align-items-center justify-content-center me-3"
          style={{ 
            width: '50px', 
            height: '50px', 
            backgroundColor: '#003B5C',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '18px'
          }}
        >
          {club.name?.charAt(0)?.toUpperCase() || 'C'}
        </div>
        <div className="flex-grow-1">
          <div className="fw-bold text-dark" style={{ fontSize: '14px' }}>{club.name}</div>
          <div className="text-muted" style={{ fontSize: '12px' }}>
            {Array.isArray(club.tags) && club.tags.length > 0 ? club.tags.slice(0, 2).join(', ') : 'General Club'}
          </div>
          {matchingTags.length > 0 && (
            <small className="text-success" style={{ fontSize: '11px' }}>
              Matches {matchingTags.length} of your interests
            </small>
          )}
          <small className="text-muted d-block" style={{ fontSize: '11px' }}>
            {followerText}
          </small>
        </div>
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={() => handleJoinClub(club.name)}
        >
          Follow
        </Button>
      </div>
    );
  };

  const renderEvents = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading your feed...</p>
        </div>
      );
    }
    if (error) {
      return (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      );
    }
    if (filteredEvents.length === 0) {
      return (
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="bi bi-calendar-event" style={{ fontSize: '4rem', color: '#dee2e6' }}></i>
          </div>
          <h5 className="text-muted">
            {activeTab === 'following' ? 'No events from followed clubs' : 'No events matching your interests'}
          </h5>
          <p className="text-muted">
            {activeTab === 'following' 
              ? 'Follow more clubs to see their events here!' 
              : 'Update your interests or follow some clubs to see more events!'
            }
          </p>
        </div>
      );
    }
    return (
      <div className="d-flex flex-column align-items-center">
        {filteredEvents.map(renderEventCard)}
      </div>
    );
  };

  return (
    <div style={{ 
      background: '#fafafa', 
      height: '100vh', 
      overflow: 'hidden'
    }}>
      <StudentNavigation />
      
      <Container fluid style={{ marginTop: '80px', padding: '1rem', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
        <Row style={{ height: '100%', overflow: 'hidden' }}>
          {/* Main Feed - Instagram Style */}
          <Col lg={8} style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold text-dark mb-0">Event Feed</h4>
            </div>
            
            {/* Tab Navigation */}
            <Nav variant="tabs" className="mb-4" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Nav.Item>
                <Nav.Link eventKey="forYou" className="fw-bold">
                  🎯 Clubs for You
                  {userTags.length > 0 && (
                    <Badge bg="primary" className="ms-2" style={{ fontSize: '10px' }}>
                      {userTags.length} interests
                    </Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="following" className="fw-bold">
                  👥 Clubs Following
                  {joinedClubs.length > 0 && (
                    <Badge bg="success" className="ms-2" style={{ fontSize: '10px' }}>
                      {joinedClubs.length} clubs
                    </Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
            </Nav>
            
            {/* Scrollable Feed Container */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: '10px', paddingBottom: '20px' }}>
              {renderEvents()}
            </div>
          </Col>

          {/* Sidebar - Club Recommendations */}
          <Col lg={4} style={{ height: '100%', overflow: 'hidden' }}>
            <div style={{ height: 'calc(100% - 20px)', overflowY: 'auto', overflowX: 'hidden', paddingRight: '10px', paddingBottom: '30px', marginTop: '10px' }}>
              {/* User Profile Summary */}
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      backgroundColor: '#003B5C',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '24px'
                    }}
                  >
                    {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <h6 className="fw-bold mb-1">{user?.email?.split('@')[0] || 'User'}</h6>
                  <p className="text-muted mb-2" style={{ fontSize: '14px' }}>
                    {joinedClubs.length} clubs followed
                  </p>
                  {userTags.length > 0 && (
                    <div className="d-flex flex-wrap justify-content-center gap-1">
                      {userTags.slice(0, 3).map((tag, idx) => (
                        <Badge 
                          key={idx} 
                          bg="light" 
                          className="px-2 py-1"
                          style={{ 
                            backgroundColor: tagColorMap[tag] || '#f8f9fa', 
                            color: '#003B5C',
                            fontSize: '11px'
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {userTags.length > 3 && (
                        <Badge bg="secondary" className="px-2 py-1" style={{ fontSize: '11px' }}>
                          +{userTags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Club Recommendations */}
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0">
                  <h6 className="fw-bold mb-0">
                    {userTags.length > 0 ? 'Recommended for You' : 'Popular Clubs'}
                  </h6>
                  {userTags.length > 0 && (
                    <small className="text-muted">Based on your interests</small>
                  )}
                </Card.Header>
                <Card.Body className="p-3">
                  {recommendedClubs.length > 0 ? (
                    recommendedClubs.map(renderClubRecommendation)
                  ) : (
                    <p className="text-muted text-center mb-0" style={{ fontSize: '14px' }}>
                      {userTags.length > 0 
                        ? 'No clubs match your interests yet' 
                        : 'Follow some clubs to get recommendations!'
                      }
                    </p>
                  )}
                </Card.Body>
              </Card>

              {/* Quick Stats */}
              <Card className="mt-4 border-0 shadow-sm">
                <Card.Body className="p-3">
                  <h6 className="fw-bold mb-3">Your Activity</h6>
                  <div className="row text-center">
                    <div className="col-6">
                      <div className="fw-bold text-primary">{filteredEvents.length}</div>
                      <small className="text-muted">
                        {activeTab === 'following' ? 'Following' : 'For You'}
                      </small>
                    </div>
                    <div className="col-6">
                      <div className="fw-bold text-success">
                        {filteredEvents.filter(e => 
                          Array.isArray(e.attendees) && e.attendees.includes(user?.uid)
                        ).length}
                      </div>
                      <small className="text-muted">Signed Up</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}