import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import clubLogo from "../assets/club_logo.png";
import { isStudentProfileComplete } from "../utils/profileCompletion";
import { Container, Card, Button, Form, Alert, Row, Col } from 'react-bootstrap';

export default function StudentSignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (!email.endsWith("@ucsc.edu")) {
        setError("You must use a valid @ucsc.edu email to sign up.");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store user type in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email,
        type: "student"
      });
      
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (!user.email.endsWith("@ucsc.edu")) {
        await user.delete();
        await auth.signOut();
        setError("You must use a valid @ucsc.edu email to sign up.");
        return;
      }
      
      // Check if user doc exists
      const userDoc = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDoc);
      
      if (!userSnap.exists()) {
        // Create new user document for sign-up
        await setDoc(userDoc, {
          email: user.email,
          type: "student"
        });
      }
      
      navigate("/profile");
    } catch (err) {
      setError("Google Sign Up failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Back to Home Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center text-white hover:text-blue-300 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-black mb-2">Student Sign Up</h1>
            <p className="text-blue-100">Join the UCSC club community</p>
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
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  UCSC Email
                </label>
                <input
                  type="email"
                  placeholder="yourname@ucsc.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg"
                />
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg"
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg"
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
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Create Account
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/student-login')}
                  className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
                >
                  Log in here
                </button>
              </p>
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

// const provider = new GoogleAuthProvider();

// export default function StudentSignUp() {
//   const navigate = useNavigate();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleSignUp = async (e) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;
//       if (!email.endsWith("@ucsc.edu")) {
//         await user.delete();
//         await auth.signOut();
//         setError("You must use a valid @ucsc.edu email to sign up.");
//         return;
//       }
//       if (password !== confirmPassword) {
//         await user.delete();
//         await auth.signOut();
//         setError("Passwords do not match.");
//         return;
//       }
//       // Store user type in Firestore
//       await setDoc(doc(db, "users", user.uid), {
//         email,
//         type: "student"
//       });
//       navigate("/profile");
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   const handleGoogleSignUp = async () => {
//     setError("");
//     try {
//       const result = await signInWithPopup(auth, provider);
//       const user = result.user;
//       if (!user.email.endsWith("@ucsc.edu")) {
//         await user.delete();
//         await auth.signOut();
//         setError("You must use a valid @ucsc.edu email to sign up.");
//         return;
//       }
//       // Check if user doc exists
//       const userDoc = doc(db, "users", user.uid);
//       const userSnap = await getDoc(userDoc);
//       if (!userSnap.exists()) {
//         await setDoc(userDoc, {
//           email: user.email,
//           type: "student"
//         });
//       }
//       navigate("/profile");
//     } catch (err) {
//       setError("Google Sign Up failed: " + err.message);
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
//                 <h2 className="text-primary fw-bold mb-4">Student Sign Up</h2>

//                 <Button 
//                   variant="outline-primary" 
//                   size="lg" 
//                   className="w-100 mb-3"
//                   onClick={handleGoogleSignUp}
//                 >
//                   <i className="fab fa-google me-2"></i>
//                   Sign up with Google
//                 </Button>

//                 <hr className="my-4" />

//                 <Form onSubmit={handleSignUp}>
//                   <Form.Group className="mb-3">
//                     <Form.Control
//                       type="email"
//                       placeholder="UCSC Email"
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
//                     variant="primary" 
//                     size="lg" 
//                     className="w-100 mb-3"
//                   >
//                     Sign Up
//                   </Button>
//                 </Form>

//                 <Button
//                   variant="link"
//                   onClick={() => navigate("/student-login")}
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
