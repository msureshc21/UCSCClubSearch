import React from 'react';
import { useNavigate } from 'react-router-dom';
import clubLogo from '../assets/club_logo.png';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';

const HomePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative max-w-6xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <h1 className="text-5xl font-black mb-4 tracking-tight">UCSC Club Search</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Discover, connect, and thrive. Your gateway to the vibrant club community at UC Santa Cruz.
            </p>
          </div>

          {/* Role Selection Section */}
          <div className="p-12">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Student Card */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl transform group-hover:scale-105 transition-transform duration-300 shadow-xl"></div>
                <div className="relative bg-white rounded-2xl p-8 border-4 border-transparent group-hover:border-blue-500 transition-all duration-300">
                  <div className="mb-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">I'm a Student</h2>
                    <p className="text-gray-600">Explore clubs, discover events, and join communities that match your interests.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/student-signup')}
                      className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      Sign Up
                    </button>
                    <button
                      onClick={() => navigate('/student-login')}
                      className="w-full border-2 border-blue-600 text-blue-600 py-4 px-6 rounded-xl font-bold text-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-200"
                    >
                      Login
                    </button>
                  </div>
                </div>
              </div>

              {/* Club Card */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl transform group-hover:scale-105 transition-transform duration-300 shadow-xl"></div>
                <div className="relative bg-white rounded-2xl p-8 border-4 border-transparent group-hover:border-purple-500 transition-all duration-300">
                  <div className="mb-6 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">I Represent a Club</h2>
                    <p className="text-gray-600">Manage your club, create events, and grow your community with powerful tools.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/club-signup')}
                      className="w-full bg-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      Sign Up
                    </button>
                    <button
                      onClick={() => navigate('/club-login')}
                      className="w-full border-2 border-purple-600 text-purple-600 py-4 px-6 rounded-xl font-bold text-lg hover:bg-purple-50 transform hover:scale-105 transition-all duration-200"
                    >
                      Login
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white text-sm opacity-75">
          <p>© 2025 UCSC Club Search. Connecting Slugs, One Club at a Time.</p>
        </div>
      </div>
    </div>
  );
};


// const HomePage = () => {
//   const navigate = useNavigate();
//   return (
//     <div className="min-vh-100 d-flex align-items-center justify-content-center" 
//          style={{ background: 'linear-gradient(135deg, #f7f7fa 60%, #e5f0ff 100%)' }}>
//       <Container className="py-4" style={{ marginTop: '80px' }}>
//         <Row className="justify-content-center">
//           <Col md={8} lg={6}>
//             <Card className="shadow-lg border-0">
//               <Card.Body className="p-5 text-center">
//                 <h1 className="text-primary fw-bold mb-3">Welcome to UCSC Club Search</h1>
//                 <img src={clubLogo} alt="UCSC Club Search Logo" 
//                      className="img-fluid mb-4" style={{ maxWidth: '130px' }} />
//                 <p className="text-muted mb-4 fs-5">
//                   Find, join, and manage UCSC clubs and events. Please select your role to continue:
//                 </p>
                
//                 <Row className="g-4">
//                   {/* Student Section */}
//                   <Col md={6}>
//                     <Card className="h-100 border-0" style={{ backgroundColor: '#e5f0ff' }}>
//                       <Card.Body className="p-4">
//                         <h2 className="text-primary fw-bold mb-3">I am a Student</h2>
//                         <div className="d-flex gap-2 justify-content-center">
//                           <Button variant="primary" size="lg" 
//                                   onClick={() => navigate('/student-signup')}>
//                             Student Sign Up
//                           </Button>
//                           <Button variant="outline-primary" size="lg" 
//                                   onClick={() => navigate('/student-login')}>
//                             Student Login
//                           </Button>
//                         </div>
//                       </Card.Body>
//                     </Card>
//                   </Col>
                  
//                   {/* Club Section */}
//                   <Col md={6}>
//                     <Card className="h-100 border-0" style={{ backgroundColor: '#fffbe5' }}>
//                       <Card.Body className="p-4">
//                         <h2 className="fw-bold mb-3" style={{ color: '#B8860B' }}>I represent a Club</h2>
//                         <div className="d-flex gap-2 justify-content-center">
//                           <Button variant="warning" size="lg" 
//                                   onClick={() => navigate('/club-signup')}>
//                             Club Sign Up
//                           </Button>
//                           <Button variant="outline-warning" size="lg" 
//                                   onClick={() => navigate('/club-login')}>
//                             Club Login
//                           </Button>
//                         </div>
//                       </Card.Body>
//                     </Card>
//                   </Col>
//                 </Row>
//               </Card.Body>
//             </Card>
//           </Col>
//         </Row>
//       </Container>
//     </div>
//   );
// };

export default HomePage;