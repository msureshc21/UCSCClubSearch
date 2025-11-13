import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { isClubProfileComplete } from "../utils/profileCompletion";

const provider = new GoogleAuthProvider();

export default function ClubLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRedirect = async (user) => {
    try {
      const clubDoc = doc(db, "clubs", user.uid);
      const clubSnap = await getDoc(clubDoc);

      if (clubSnap.exists()) {
        const profileComplete = await isClubProfileComplete(user.uid);
        if (profileComplete) {
          navigate("/club-dashboard");
        } else {
          navigate("/club-profile");
        }
      } else {
        navigate("/notifications");
      }
    } catch (err) {
      console.error("Error checking user type:", err);
      navigate("/notifications");
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleRedirect(userCredential.user);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = doc(db, "clubs", user.uid);
      const userSnap = await getDoc(userDoc);
      if (!userSnap.exists()) {
        await user.delete();
        await auth.signOut();
        setError("You must sign up before logging in with Google.");
        return;
      }

      await handleRedirect(user);
    } catch (err) {
      setError("Google Login failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Back to Home Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center text-white hover:text-purple-300 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-black mb-2">Club Login</h1>
            <p className="text-purple-100">Manage your club and reach students</p>
          </div>

          {/* Form Section */}
          <div className="p-8">
            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-bold text-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-3 mb-6 shadow-md"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Log in with Google
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-semibold">OR</span>
              </div>
            </div>

            {/* Email/Password Inputs */}
            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Club Email
                </label>
                <input
                  type="email"
                  placeholder="yourclub@ucsc.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-lg"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-lg"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">{error}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleEmailLogin}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Log In
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/club-signup')}
                  className="text-purple-600 font-bold hover:text-purple-800 transition-colors"
                >
                  Sign up here
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white text-sm opacity-75">
          <p>Secure login powered by Firebase Authentication</p>
        </div>
      </div>
    </div>
  );
}

// import React, { useState } from "react";
// import {
//   signInWithEmailAndPassword,
//   signInWithPopup,
//   GoogleAuthProvider,
// } from "firebase/auth";
// import { useNavigate } from "react-router-dom";
// import { auth, db } from "../firebase";
// import { doc, getDoc } from "firebase/firestore";
// import clubLogo from "../assets/club_logo.png";
// import { isClubProfileComplete } from "../utils/profileCompletion";
// import { Container, Card, Button, Form, Alert, Row, Col } from 'react-bootstrap';

// const provider = new GoogleAuthProvider();

// export default function ClubLogin() {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleRedirect = async (user) => {
//     try {
//       const clubDoc = doc(db, "clubs", user.uid);
//       const clubSnap = await getDoc(clubDoc);

//       if (clubSnap.exists()) {
//         // Check if profile is complete
//         const profileComplete = await isClubProfileComplete(user.uid);
//         if (profileComplete) {
//           navigate("/club-dashboard");
//         } else {
//           navigate("/club-profile");
//         }
//       } else {
//         navigate("/notifications"); // fallback in case data is missing
//       }
//     } catch (err) {
//       console.error("Error checking user type:", err);
//       navigate("/notifications");
//     }
//   };

//   const handleEmailLogin = async (e) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       await handleRedirect(userCredential.user);
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   const handleGoogleLogin = async () => {
//     try {
//       const result = await signInWithPopup(auth, provider);
//       const user = result.user;

//       const userDoc = doc(db, "clubs", user.uid);
//       const userSnap = await getDoc(userDoc);
//       if (!userSnap.exists()) {
//         await user.delete();
//         await auth.signOut();
//         setError("You must sign up before logging in with Google.");
//         return;
//       }

//       await handleRedirect(user);
//     } catch (err) {
//       setError("Google Login failed: " + err.message);
//     }
//   };

//   return (
//     <div className="min-vh-100 d-flex align-items-center justify-content-center" 
//          style={{ background: 'linear-gradient(135deg, #f7f7fa 60%, #e5f0ff 100%)' }}>
//       <Container className="py-4" style={{ marginTop: '80px' }}>
//         <Row className="justify-content-center">
//           <Col md={6} lg={4}>
//             <Card className="shadow-lg border-0">
//               <Card.Body className="p-5 text-center">
//                 <img src={clubLogo} alt="Club Logo" className="img-fluid mb-4" style={{ maxWidth: '120px' }} />
//                 <h2 className="text-primary fw-bold mb-4">Club Login</h2>

//                 <Button 
//                   variant="outline-primary" 
//                   size="lg" 
//                   className="w-100 mb-3"
//                   onClick={handleGoogleLogin}
//                 >
//                   <i className="fab fa-google me-2"></i>
//                   Log in with Google
//                 </Button>

//                 <hr className="my-4" />

//                 <Form onSubmit={handleEmailLogin}>
//                   <Form.Group className="mb-3">
//                     <Form.Control
//                       type="email"
//                       placeholder="Club Email"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       required
//                       size="lg"
//                     />
//                   </Form.Group>

//                   <Form.Group className="mb-3">
//                     <Form.Control
//                       type="password"
//                       placeholder="Password"
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       required
//                       size="lg"
//                     />
//                   </Form.Group>

//                   {error && (
//                     <Alert variant="danger" className="mb-3">
//                       {error}
//                     </Alert>
//                   )}

//                   <Button 
//                     type="submit" 
//                     variant="primary" 
//                     size="lg" 
//                     className="w-100 mb-3"
//                   >
//                     Log In
//                   </Button>
//                 </Form>

//                 <Button
//                   variant="link"
//                   onClick={() => navigate("/club-signup")}
//                   className="text-decoration-none"
//                 >
//                   Don't have an account? Sign up here
//                 </Button>
//               </Card.Body>
//             </Card>
//           </Col>
//         </Row>
//       </Container>
//     </div>
//   );
// }
