/**
 * Get the value of a cookie by name
 * @param name The name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null; // Return null during SSR
  }
  
  const cookies = document.cookie.split(';').map(cookie => cookie.trim());
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  
  if (!cookie) {
    return null;
  }
  
  return cookie.split('=')[1];
}

/**
 * Set a cookie with the given name and value
 * @param name The name of the cookie
 * @param value The value to store
 * @param days Number of days until the cookie expires (optional)
 */
export function setCookie(name: string, value: string, days?: number): void {
  if (typeof document === 'undefined') {
    return; // Do nothing during SSR
  }
  
  let expires = '';
  
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  
  document.cookie = `${name}=${value}${expires}; path=/; SameSite=Lax`;
}

/**
 * Delete a cookie by setting its expiration to the past
 * @param name The name of the cookie to delete
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') {
    return; // Do nothing during SSR
  }
  
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
}

/**
 * Check if a cookie exists
 * @param name The name of the cookie to check
 * @returns Boolean indicating if the cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

/**
 * Get all cookies as an object
 * @returns Object with cookie name-value pairs
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') {
    return {}; // Return empty object during SSR
  }
  
  const cookies: Record<string, string> = {};
  const cookieStrings = document.cookie.split(';').map(cookie => cookie.trim());
  
  cookieStrings.forEach(cookie => {
    if (cookie) {
      const [name, value] = cookie.split('=');
      if (name && value) {
        cookies[name] = value;
      }
    }
  });
  
  return cookies;
} 