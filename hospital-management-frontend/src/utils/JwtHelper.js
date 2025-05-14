// JWT Helper functions

// Store JWT in local storage
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Get JWT from local storage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Remove JWT from local storage
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Check if user is authenticated (has a token)
export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

// Parse JWT payload (without validation - frontend only)
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

// Get user info from token
export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;
  
  const decoded = parseJwt(token);
  if (!decoded) return null;

  // Map the claims to a more frontend-friendly format
  return {
    id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
    name: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
    email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
    role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
    exp: decoded.exp
  };
};