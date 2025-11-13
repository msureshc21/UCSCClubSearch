import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import approvedClubEmails from "../data/approvedClubEmails";

const provider = new GoogleAuthProvider();

export default function ClubSignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const isApprovedEmail = (email) => {
    return approvedClubEmails.includes(email.toLowerCase());
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!isApprovedEmail(email)) {
        await user.delete();
        await auth.signOut();
        setError("This email is not recognized as an official UCSC club.");
        return;
      }

      await setDoc(doc(db, "clubs", user.uid), {
        email,
        type: "club"
      });

      navigate("/club-profile");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userEmail = user.email;

      if (!isApprovedEmail(userEmail)) {
        await user.delete();
        await auth.signOut();
        setError("This Google account is not recognized as an official UCSC club.");
        return;
      }

      await setDoc(doc(db, "clubs", user.uid), {
        email: userEmail,
        type: "club"
      });

      navigate("/club-profile");
    } catch (err) {
      setError("Google Sign-Up failed: " + err.message);
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
            <h1 className="text-3xl font-black mb-2">Club Sign Up</h1>
            <p className="text-purple-100">Register your official UCSC club</p>
          </div>

          {/* Form Section */}
          <div className="p-8">
            {/* Google Sign Up Button */}
            <button
              onClick={handleGoogleSignUp}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-bold text-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-3 mb-6 shadow-md"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
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
                  Official Club Email
                </label>
                <input
                  type="email"
                  placeholder="yourclub@ucsc.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Must be an approved UCSC club email</p>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-lg"
                />
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                onClick={handleEmailSignUp}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Create Club Account
              </button>
            </div>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/club-login')}
                  className="text-purple-600 font-bold hover:text-purple-800 transition-colors"
                >
                  Log in here
                </button>
              </p>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-purple-800">
                  <p className="font-bold mb-1">Official Clubs Only</p>
                  <p>Only recognized UCSC club email addresses can register. Contact us if your club needs to be added.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white text-sm opacity-75">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}

// import React, { useState } from "react";
// import {
//   createUserWithEmailAndPassword,
//   signInWithPopup,
//   GoogleAuthProvider,
// } from "firebase/auth";
// import { useNavigate } from "react-router-dom";
// import { auth, db } from "../firebase";
// import { doc, setDoc } from "firebase/firestore";
// import clubLogo from "../assets/club_logo.png";
// import approvedClubEmails from "../data/approvedClubEmails";
// import { Container, Card, Button, Form, Alert, Row, Col } from 'react-bootstrap';

// const provider = new GoogleAuthProvider();

// export default function ClubSignUp() {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [error, setError] = useState("");

//   const isApprovedEmail = (email) => {
//     return approvedClubEmails.includes(email.toLowerCase());
//   };

//   const handleEmailSignUp = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (password !== confirmPassword) {
//       setError("Passwords do not match.");
//       return;
//     }

//     try {
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;

//       if (!isApprovedEmail(email)) {
//         await user.delete();
//         await auth.signOut();
//         setError("This email is not recognized as an official UCSC club.");
//         return;
//       }

//       await setDoc(doc(db, "clubs", user.uid), {
//         email,
//         type: "club"
//       });

//       navigate("/club-profile");
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   const handleGoogleSignUp = async () => {
//     setError("");
//     try {
//       const result = await signInWithPopup(auth, provider);
//       const user = result.user;
//       const userEmail = user.email;

//       if (!isApprovedEmail(userEmail)) {
//         await user.delete();
//         await auth.signOut();
//         setError("This Google account is not recognized as an official UCSC club.");
//         return;
//       }

//       await setDoc(doc(db, "clubs", user.uid), {
//         email: userEmail,
//         type: "club"
//       });

//       navigate("/club-profile");
//     } catch (err) {
//       setError("Google Sign-Up failed: " + err.message);
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
//                 <h2 className="text-primary fw-bold mb-4">Club Sign Up</h2>

//                 <Button 
//                   variant="outline-warning" 
//                   size="lg" 
//                   className="w-100 mb-3"
//                   onClick={handleGoogleSignUp}
//                 >
//                   <i className="fab fa-google me-2"></i>
//                   Sign up with Google
//                 </Button>

//                 <hr className="my-4" />

//                 <Form onSubmit={handleEmailSignUp}>
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

//                   <Form.Group className="mb-3">
//                     <Form.Control
//                       type="password"
//                       placeholder="Confirm Password"
//                       value={confirmPassword}
//                       onChange={(e) => setConfirmPassword(e.target.value)}
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
//                     variant="warning" 
//                     size="lg" 
//                     className="w-100 mb-3"
//                   >
//                     Sign Up
//                   </Button>
//                 </Form>

//                 <Button
//                   variant="link"
//                   onClick={() => navigate("/club-login")}
//                   className="text-decoration-none"
//                 >
//                   Already have an account? Log in here
//                 </Button>
//               </Card.Body>
//             </Card>
//           </Col>
//         </Row>
//       </Container>
//     </div>
//   );
// }
