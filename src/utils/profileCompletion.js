import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Check if a student profile is complete
export const isStudentProfileComplete = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return false;
    }
    
    const userData = userSnap.data();
    
    // Check if required fields are filled
    const requiredFields = ['name', 'major'];
    const hasRequiredFields = requiredFields.every(field => 
      userData[field] && userData[field].trim() !== ''
    );
    
    return hasRequiredFields;
  } catch (error) {
    console.error("Error checking student profile completion:", error);
    return false;
  }
};

// Check if a club profile is complete
export const isClubProfileComplete = async (clubId) => {
  try {
    const clubRef = doc(db, "clubs", clubId);
    const clubSnap = await getDoc(clubRef);
    
    if (!clubSnap.exists()) {
      return false;
    }
    
    const clubData = clubSnap.data();
    
    // Check if required fields are filled
    const requiredFields = ['name', 'elevatorPitch', 'description', 'email', 'instagram'];
    const hasRequiredFields = requiredFields.every(field => 
      clubData[field] && clubData[field].trim() !== ''
    );
    
    // Check if description has minimum content (at least 10 words)
    const hasValidDescription = clubData.description && 
      clubData.description.trim().split(/\s+/).length >= 10;
    
    // Check if at least one image is uploaded
    const hasImage = clubData.imageUrls && clubData.imageUrls.length > 0;
    
    // Check if at least one tag is added
    const hasTag = clubData.tags && clubData.tags.length > 0;
    
    return hasRequiredFields && hasValidDescription && hasImage && hasTag;
  } catch (error) {
    console.error("Error checking club profile completion:", error);
    return false;
  }
};

// Get user type (student or club)
export const getUserType = async (userId) => {
  try {
    // First check if it's a student
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.type === "student") {
        return "student";
      }
    }
    
    // Then check if it's a club
    const clubRef = doc(db, "clubs", userId);
    const clubSnap = await getDoc(clubRef);
    
    if (clubSnap.exists()) {
      return "club";
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user type:", error);
    return null;
  }
}; 