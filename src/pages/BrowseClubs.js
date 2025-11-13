import React, { useEffect, useState } from 'react';
import StudentNavigation from '../components/StudentNavigation';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import availableTags from '../data/availableTags';
import { Container, Card, Button, Badge, Form, Row, Col, Carousel } from 'react-bootstrap';

// Add carousel control styles
const carouselControlStyles = `
  .browse-clubs-carousel .carousel-control-prev,
  .browse-clubs-carousel .carousel-control-next {
    width: 50px;
    height: 50px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.9;
    transition: opacity 0.3s ease;
  }
  .browse-clubs-carousel .carousel-control-prev:hover,
  .browse-clubs-carousel .carousel-control-next:hover {
    opacity: 1;
  }
  .browse-clubs-carousel .carousel-control-prev {
    left: 10px;
  }
  .browse-clubs-carousel .carousel-control-next {
    right: 10px;
  }
`;

function BrowseClubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carouselIdx, setCarouselIdx] = useState({});
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [joinedClubs, setJoinedClubs] = useState([]);
  const [user, setUser] = useState(null);

  // Pastel color palette for tags
  const pastelColors = [
    '#ffe5e5', '#e5ffe5', '#e5f0ff', '#fffbe5', '#fff0e5', '#f3e5ff', '#ffe5f0', '#e5fff6', '#f5e5ff', '#e5fff0', '#f5ffe5', '#e5eaff', '#fff5e5', '#f0f0f0',
  ];
  const tagColorMap = availableTags.reduce((map, tag, idx) => {
    map[tag] = pastelColors[idx % pastelColors.length];
    return map;
  }, {});

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchJoinedClubs(user);
      } else {
        setJoinedClubs([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchJoinedClubs = async (currentUser) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setJoinedClubs(Array.isArray(data.joinedClubs) ? data.joinedClubs : []);
      }
    } catch (error) {
      console.error('Error fetching joined clubs:', error);
    }
  };

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const clubsSnapshot = await getDocs(collection(db, 'clubs'));
        const clubsList = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClubs(clubsList);
      } catch (err) {
        console.error('Error fetching clubs:', err);
      }
      setLoading(false);
    };
    fetchClubs();
  }, []);

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name?.toLowerCase().includes(search.toLowerCase()) ||
      club.description?.toLowerCase().includes(search.toLowerCase());
    const matchesTags = selectedTags.length === 0 || (Array.isArray(club.tags) && club.tags.some(tag => selectedTags.includes(tag)));
    return matchesSearch && matchesTags;
  });

  const handleCarousel = (id, dir, max) => setCarouselIdx(prev => ({
    ...prev,
    [id]: (prev[id] || 0) + dir < 0 ? max - 1 : ((prev[id] || 0) + dir) % max
  }));
  const handleAddTag = (tag) => {
    if (!selectedTags.includes(tag)) setSelectedTags([...selectedTags, tag]);
  };
  const handleRemoveTag = (tag) => setSelectedTags(selectedTags.filter(t => t !== tag));

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
        // Also add the student's uid to the club's followers array
        const clubDoc = clubs.find(c => c.name === clubName);
        if (clubDoc) {
          const clubRef = doc(db, 'clubs', clubDoc.id);
          await updateDoc(clubRef, { followers: arrayUnion(user.uid) });
        }
      }
    } catch (error) {
      console.error('Error joining club:', error);
    }
  };

  const handleUnfollowClub = async (clubName) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      let joined = [];
      if (userSnap.exists()) {
        const data = userSnap.data();
        joined = Array.isArray(data.joinedClubs) ? data.joinedClubs : [];
      }
      if (joined.includes(clubName)) {
        const updated = joined.filter(name => name !== clubName);
        await updateDoc(userRef, { joinedClubs: updated });
        setJoinedClubs(updated);
        // Also remove the student's uid from the club's followers array
        const clubDoc = clubs.find(c => c.name === clubName);
        if (clubDoc) {
          const clubRef = doc(db, 'clubs', clubDoc.id);
          await updateDoc(clubRef, { followers: arrayRemove(user.uid) });
        }
      }
    } catch (error) {
      console.error('Error unfollowing club:', error);
    }
  };

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #f7f7fa 60%, #e5f0ff 100%)' }}>
      <style>{carouselControlStyles}</style>
      <StudentNavigation />
      <Container className="py-4" style={{ marginTop: '80px' }}>
        <h2 className="text-primary fw-bold mb-4">Browse Clubs</h2>
        
        {/* Search and Filter Section */}
        <Row className="mb-4 g-3">
          <Col md={6}>
            <Form.Control
              type="text"
              placeholder="Search clubs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control-lg"
            />
          </Col>
          <Col md={6}>
            <div className="d-flex align-items-center gap-2">
              <Form.Label className="fw-bold mb-0">Filter by tag:</Form.Label>
              <Form.Select
                value=""
                onChange={e => { if (e.target.value) handleAddTag(e.target.value); }}
                className="flex-grow-1"
              >
                <option value="">Select tag</option>
                {availableTags.filter(tag => !selectedTags.includes(tag)).map((tag, idx) => (
                  <option key={idx} value={tag}>{tag}</option>
                ))}
              </Form.Select>
            </div>
          </Col>
        </Row>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="mb-4">
            {selectedTags.map((tag, idx) => (
              <Badge 
                key={idx} 
                bg="secondary" 
                className="me-2 mb-2"
                style={{ backgroundColor: tagColorMap[tag] || '#6c757d', color: '#003B5C' }}
              >
                {tag}
                <Button 
                  variant="link" 
                  className="text-decoration-none p-0 ms-2"
                  onClick={() => handleRemoveTag(tag)}
                  style={{ color: '#dc3545' }}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading clubs...</p>
          </div>
        ) : (
          <Row className="g-4">
            {filteredClubs.map(club => {
              const imgs = Array.isArray(club.imageUrls) ? club.imageUrls : [];
              const firstTag = Array.isArray(club.tags) && club.tags.length > 0 ? club.tags[0] : availableTags[0];
              const bgColor = tagColorMap[firstTag] || '#fff';
              
              return (
                <Col key={club.id} lg={5} md={6}>
                  <Card 
                    className="h-100 shadow-sm border-0" 
                    style={{ backgroundColor: bgColor }}
                  >
                    <Card.Body className="p-4">
                      <Card.Title className="text-center fw-bold text-primary mb-3">
                        {club.name}
                      </Card.Title>
                      
                      {imgs.length > 0 && (
                        <div className="mb-3 position-relative">
                          <Carousel 
                            activeIndex={carouselIdx[club.id] || 0}
                            onSelect={(index) => setCarouselIdx(prev => ({ ...prev, [club.id]: index }))}
                            indicators={false}
                            controls={true}
                            className="mb-3 browse-clubs-carousel"
                            prevIcon={
                              <span 
                                aria-hidden="true" 
                                className="carousel-control-prev-icon"
                                style={{
                                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                  borderRadius: '50%',
                                  width: '45px',
                                  height: '45px',
                                  backgroundSize: '50%',
                                  border: '3px solid white',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                }}
                              />
                            }
                            nextIcon={
                              <span 
                                aria-hidden="true" 
                                className="carousel-control-next-icon"
                                style={{
                                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                  borderRadius: '50%',
                                  width: '45px',
                                  height: '45px',
                                  backgroundSize: '50%',
                                  border: '3px solid white',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                }}
                              />
                            }
                          >
                            {imgs.map((img, idx) => (
                              <Carousel.Item key={idx}>
                                <img 
                                  src={img} 
                                  alt={`Club ${idx + 1}`} 
                                  className="d-block w-100 rounded"
                                  style={{ height: '220px', objectFit: 'cover' }}
                                />
                              </Carousel.Item>
                            ))}
                          </Carousel>
                        </div>
                      )}
                      
                      {/* Elevator Pitch - Always Visible */}
                      {club.elevatorPitch && (
                        <div className="mb-3">
                          <p className="text-muted mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                            {club.elevatorPitch}
                          </p>
                        </div>
                      )}
                      
                      {Array.isArray(club.tags) && club.tags.length > 0 && (
                        <div className="mb-3 text-center">
                          {club.tags.map((tag, idx) => (
                            <Badge 
                              key={idx} 
                              bg="light" 
                              className="me-1 mb-1"
                              style={{ 
                                backgroundColor: tagColorMap[tag] || '#f8f9fa', 
                                color: '#003B5C' 
                              }}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Join/Unfollow Club Button */}
                      {joinedClubs.includes(club.name) ? (
                        <Button
                          variant="outline-danger"
                          className="w-100"
                          onClick={e => { e.stopPropagation(); handleUnfollowClub(club.name); }}
                        >
                          Unfollow
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          className="w-100"
                          onClick={e => { e.stopPropagation(); handleJoinClub(club.name); }}
                        >
                          Follow
                        </Button>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>
    </div>
  );
}

export default BrowseClubs; 