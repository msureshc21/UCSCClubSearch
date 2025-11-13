import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; 
import { auth } from '../firebase';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import ClubNavigation from '../components/ClubNavigation';
import availableTags from '../data/availableTags';
import { isClubProfileComplete } from '../utils/profileCompletion';
import { Container, Card, Button, Form, Alert, Row, Col, Badge, Modal } from 'react-bootstrap';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/imageCrop';

const ClubProfilePage = () => {
  const db = getFirestore();
  const [clubData, setClubData] = useState({
    name: '',
    email: '',
    instagram: '',
    elevatorPitch: '',
    description: '',
    tags: [],
    imageUrls: [],
    clubIcon: '',
  });
  const [newTag, setNewTag] = useState('');
  const [clubIcon, setClubIcon] = useState('');
  const [carouselImages, setCarouselImages] = useState([]);
  const [profileComplete, setProfileComplete] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Cropping state
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropType, setCropType] = useState(null); // 'icon' or 'carousel'
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropping, setCropping] = useState(false);
  
  const currentUser = auth.currentUser;
  const maxWords = 150;
  const wordCount = clubData.description.trim() === '' ? 0 : clubData.description.trim().split(/\s+/).length;

  // Aspect ratios for different crop types
  const getAspectRatio = () => {
    return cropType === 'icon' ? 1 : 16 / 9; // 1:1 for icon, 16:9 for carousel
  };

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        const docRef = doc(db, 'clubs', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setClubData({
            name: data.name || '',
            email: data.email || '',
            instagram: data.instagram || '',
            elevatorPitch: data.elevatorPitch || '',
            description: data.description || '',
            tags: data.tags || [],
            imageUrls: data.imageUrls || [],
            clubIcon: data.clubIcon || '',
          });
          setClubIcon(data.clubIcon || '');
          setCarouselImages(data.imageUrls || []);
          
          // Check profile completion on load
          const complete = await isClubProfileComplete(currentUser.uid);
          setProfileComplete(complete);
        }
      }
    };
    fetchData();
  }, [currentUser, db]);

  const handleChange = (e) => {
    setClubData({ ...clubData, [e.target.name]: e.target.value });
  };

  const addTag = () => {
    if (newTag && !clubData.tags.includes(newTag)) {
      setClubData({ ...clubData, tags: [...clubData.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setClubData({ ...clubData, tags: clubData.tags.filter(tag => tag !== tagToRemove) });
  };

  // Cloudinary upload helper
  const uploadToCloudinary = async (file) => {
    const url = 'https://api.cloudinary.com/v1_1/dwo1u3dhn/image/upload';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ucsc_club_upload');
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Cloudinary upload failed');
    const data = await response.json();
    return data.secure_url;
  };

  // Convert blob URL to File object
  const blobToFile = (blobUrl, fileName) => {
    return fetch(blobUrl)
      .then(res => res.blob())
      .then(blob => {
        return new File([blob], fileName, { type: 'image/jpeg' });
      });
  };

  // Handle file selection for icon or carousel
  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setCropType(type);
      setShowCropModal(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  // Handle crop completion
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Apply crop and upload
  const handleCropComplete = async () => {
    if (!imageSrc || !croppedAreaPixels || !cropType) return;

    setCropping(true);
    try {
      // Get cropped image as blob URL
      const croppedImageUrl = await getCroppedImg(
        imageSrc,
        croppedAreaPixels
      );

      // Convert blob URL to File
      const fileName = cropType === 'icon' ? 'club-icon.jpg' : `carousel-${Date.now()}.jpg`;
      const file = await blobToFile(croppedImageUrl, fileName);

      // Upload to Cloudinary
      const uploadedUrl = await uploadToCloudinary(file);

      // Update state based on crop type
      if (cropType === 'icon') {
        setClubIcon(uploadedUrl);
        setClubData({ ...clubData, clubIcon: uploadedUrl });
      } else {
        const updatedCarousel = [...carouselImages, uploadedUrl];
        setCarouselImages(updatedCarousel);
        setClubData({ ...clubData, imageUrls: updatedCarousel });
      }

      // Close modal and reset
      setShowCropModal(false);
      setImageSrc(null);
      setCropType(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    } catch (error) {
      console.error('Error cropping/uploading image:', error);
      alert('Failed to crop and upload image. Please try again.');
    } finally {
      setCropping(false);
    }
  };

  // Remove carousel image
  const removeCarouselImage = (index) => {
    const updated = carouselImages.filter((_, i) => i !== index);
    setCarouselImages(updated);
    setClubData({ ...clubData, imageUrls: updated });
  };

  // Replace club icon
  const handleReplaceIcon = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => handleFileSelect(e, 'icon');
    input.click();
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    const words = value.trim().split(/\s+/);
    if (value.trim() === '' || words.length <= maxWords) {
      setClubData({ ...clubData, description: value });
    } else {
      setClubData({ ...clubData, description: words.slice(0, maxWords).join(' ') });
    }
  };

  const saveChanges = async () => {
    if (currentUser) {
      const docRef = doc(db, 'clubs', currentUser.uid);
      await setDoc(docRef, {
        ...clubData,
        clubIcon: clubIcon,
        imageUrls: carouselImages,
      }, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Recheck profile completion after saving
      const complete = await isClubProfileComplete(currentUser.uid);
      setProfileComplete(complete);
    }
  };

  return (
    <>
      <ClubNavigation />
      <Container className="py-4" style={{ marginTop: '80px' }}>
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-primary text-white">
                <h2 className="mb-0 fw-bold">📘 Club Profile</h2>
              </Card.Header>
              <Card.Body className="p-4">
                {!profileComplete && (
                  <Alert variant="warning" className="mb-4">
                    <strong>⚠️ Profile Incomplete</strong><br />
                    Please complete the following information to access all features of the app:
                    <ul className="mb-0 mt-2">
                      {!clubData.name.trim() && <li>Add your club name</li>}
                      {!clubData.email.trim() && <li>Add your club email</li>}
                      {!clubData.instagram.trim() && <li>Add your club Instagram</li>}
                      {!clubData.elevatorPitch.trim() && 
                        <li>Add an elevator pitch (required)</li>}
                      {(!clubData.description || clubData.description.trim().split(/\s+/).length < 10) && 
                        <li>Add a description with at least 10 words</li>}
                      {(!carouselImages || carouselImages.length === 0) && 
                        <li>Upload at least one carousel image</li>}
                      {(!clubData.tags || clubData.tags.length === 0) && 
                        <li>Add at least one tag</li>}
                    </ul>
                  </Alert>
                )}

                {saveSuccess && (
                  <Alert variant="success" className="mb-4">
                    Changes saved successfully!
                  </Alert>
                )}

                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Club Name</Form.Label>
                    <Form.Control
                      name="name"
                      value={clubData.name}
                      onChange={handleChange}
                      placeholder="Enter club name"
                    />
                  </Form.Group>

                  {/* Club Icon Section */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">🏷️ Club Icon</Form.Label>
                    <p className="text-muted small mb-2">
                      Upload a square icon for your club (recommended: 300x300px). This will be displayed as your club's profile picture. You can replace it anytime.
                    </p>
                    <div className="d-flex align-items-center gap-3">
                      {clubIcon ? (
                        <>
                          <div className="position-relative">
                            <img 
                              src={clubIcon} 
                              alt="Club icon" 
                              className="rounded shadow-sm"
                              style={{ height: '150px', width: '150px', objectFit: 'cover', border: '3px solid #0d6efd' }}
                            />
                          </div>
                          <Button
                            variant="outline-primary"
                            onClick={handleReplaceIcon}
                          >
                            🔄 Replace Icon
                          </Button>
                        </>
                      ) : (
                        <div>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, 'icon')}
                            style={{ maxWidth: '300px' }}
                          />
                          <Form.Text className="text-muted d-block mt-1">
                            Select an image to crop and upload as your club icon
                          </Form.Text>
                        </div>
                      )}
                    </div>
                  </Form.Group>

                  {/* Carousel Images Section */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">🖼️ Carousel Images</Form.Label>
                    <p className="text-muted small mb-2">
                      Upload images for the carousel that students see when browsing clubs (recommended: 1200x675px, 16:9 aspect ratio). You can upload multiple images. Each image will be cropped to the proper size.
                    </p>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'carousel')}
                      style={{ maxWidth: '300px' }}
                    />
                    <Form.Text className="text-muted d-block mt-1 mb-2">
                      Select an image to crop and add to your carousel
                    </Form.Text>
                    {carouselImages.length > 0 && (
                      <>
                        <div className="d-flex gap-2 mt-3 overflow-auto" style={{ flexWrap: 'wrap' }}>
                          {carouselImages.map((url, index) => (
                            <div key={index} className="position-relative">
                              <img 
                                src={url} 
                                alt={`carousel-${index}`} 
                                className="rounded shadow-sm"
                                style={{ height: '120px', width: '200px', objectFit: 'cover', border: '2px solid #dee2e6' }}
                              />
                              <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0 rounded-circle"
                                style={{ transform: 'translate(50%, -50%)', width: '28px', height: '28px', padding: 0, fontSize: '16px', lineHeight: '1' }}
                                onClick={() => removeCarouselImage(index)}
                                title="Remove image"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Form.Text className="text-muted d-block mt-2">
                          {carouselImages.length} image{carouselImages.length !== 1 ? 's' : ''} uploaded
                        </Form.Text>
                      </>
                    )}
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Club Email</Form.Label>
                        <Form.Control
                          name="email"
                          value={clubData.email}
                          onChange={handleChange}
                          placeholder="Enter club email"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Instagram</Form.Label>
                        <Form.Control
                          name="instagram"
                          value={clubData.instagram}
                          onChange={handleChange}
                          placeholder="Enter Instagram handle"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                      🎯 Elevator Pitch <span className="text-danger">*</span>
                    </Form.Label>
                    <p className="text-muted small mb-2">
                      A short, compelling pitch that appears on your club card (2-3 sentences). This is what students see first when browsing clubs.
                    </p>
                    <Form.Control
                      as="textarea"
                      name="elevatorPitch"
                      value={clubData.elevatorPitch}
                      rows="3"
                      onChange={handleChange}
                      placeholder="Write a compelling pitch that makes students want to join your club..."
                      required
                    />
                    <Form.Text className="text-muted">
                      {clubData.elevatorPitch.trim().split(/\s+/).filter(w => w.length > 0).length} words
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      value={clubData.description}
                      rows="4"
                      onChange={handleDescriptionChange}
                      placeholder="Describe your club in detail..."
                    />
                    <Form.Text className={`text-${wordCount > maxWords ? 'danger' : 'muted'}`}>
                      {wordCount}/{maxWords} words
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Tags / Topics</Form.Label>
                    <div className="mb-3">
                      {clubData.tags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          bg="primary" 
                          className="me-2 mb-2"
                        >
                          {tag}
                          <Button
                            variant="link"
                            className="text-white text-decoration-none p-0 ms-2"
                            onClick={() => removeTag(tag)}
                          >
                            ×
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <Row>
                      <Col md={8}>
                        <Form.Select
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                        >
                          <option value="">-- Select Tag --</option>
                          {availableTags.map((tag, idx) => (
                            <option key={idx} value={tag}>{tag}</option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={4}>
                        <Button 
                          variant="outline-primary" 
                          onClick={addTag}
                          className="w-100"
                        >
                          + Add Tag
                        </Button>
                      </Col>
                    </Row>
                  </Form.Group>

                  <div className="text-center">
                    <Button 
                      variant="primary" 
                      size="lg" 
                      onClick={saveChanges}
                      className="w-100"
                    >
                      Save Changes
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Crop Modal */}
      <Modal 
        show={showCropModal} 
        onHide={() => {
          setShowCropModal(false);
          setImageSrc(null);
          setCropType(null);
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Crop {cropType === 'icon' ? 'Club Icon' : 'Carousel Image'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ position: 'relative', width: '100%', height: '400px', background: '#000' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={getAspectRatio()}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="mt-3">
            <Form.Label>Zoom: {zoom.toFixed(2)}x</Form.Label>
            <Form.Range
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
            />
          </div>
          <div className="mt-3 p-3 bg-light rounded">
            <p className="text-muted small mb-0">
              <strong>Instructions:</strong> {cropType === 'icon' 
                ? 'Drag to position and use the zoom slider to adjust. The crop area is fixed to a square (1:1 ratio). Recommended final size: 300x300px.'
                : 'Drag to position and use the zoom slider to adjust. The crop area is fixed to a wide rectangle (16:9 ratio). Recommended final size: 1200x675px.'}
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowCropModal(false);
              setImageSrc(null);
              setCropType(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCropComplete}
            disabled={cropping}
          >
            {cropping ? 'Processing...' : 'Apply Crop & Upload'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ClubProfilePage;
