# 🔧 Profile Page Troubleshooting Guide

## 🚨 **Issue: Profile Page Not Working**

I've identified and fixed several potential issues with the profile page redirection. Here's what I've done and how to test it.

## ✅ **Fixes Applied**

### **1. Enhanced Authentication Check**
```javascript
// Added better config waiting and error handling
async function waitForConfig() {
    console.log('Waiting for config...');
    let attempts = 0;
    while ((!window.config || !window.config.supabase) && attempts < 20) {
        console.log('Config not ready, waiting... attempt', attempts + 1);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.config || !window.config.supabase) {
        console.error('Config not available after waiting');
        alert('Error: Unable to load configuration. Please refresh the page.');
        return;
    }
    
    console.log('Config loaded successfully');
}
```

### **2. Better Error Handling**
```javascript
async function initAuth() {
    try {
        console.log('Initializing authentication...');
        
        if (!window.config || !window.config.supabase) {
            throw new Error('Supabase client not available');
        }

        const { data: { session }, error } = await window.config.supabase.auth.getSession();
        console.log('Session check result:', { session, error });
        
        if (error) {
            console.error('Session error:', error);
            throw error;
        }
        
        if (session && session.user) {
            currentUser = session.user;
            console.log('User authenticated:', currentUser.email);
        } else {
            console.log('No active session, redirecting to auth page');
            window.location.href = 'auth.html?redirect=profile.html';
            return;
        }
    } catch (error) {
        console.error('Auth initialization error:', error);
        alert('Authentication error. Please sign in again.');
        window.location.href = 'auth.html?redirect=profile.html';
    }
}
```

### **3. Enhanced Dropdown Debugging**
```javascript
function setupAuthEventListeners() {
    const userBtn = document.getElementById('user-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    console.log('Setting up auth event listeners...', { userBtn, userDropdown });
    
    if (userBtn && userDropdown) {
        userBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('User button clicked, toggling dropdown');
            userDropdown.classList.toggle('active');
            console.log('Dropdown active state:', userDropdown.classList.contains('active'));
        });

        // Add click listeners to dropdown items for debugging
        const profileLink = document.querySelector('a[href="profile.html"]');
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                console.log('Profile link clicked');
                // Let the default behavior happen (navigation)
            });
        }
    }
}
```

## 🧪 **Testing Steps**

### **Step 1: Check if You're Signed In**
1. **Open your website** in browser
2. **Check the navbar** → Should show your name/profile button (not "Sign In")
3. **If showing "Sign In"** → You need to sign in first

### **Step 2: Test Dropdown Functionality**
1. **Open browser console** (F12 → Console tab)
2. **Click on your name** in the navbar
3. **Check console messages** → Should see:
   ```
   Setting up auth event listeners...
   User button clicked, toggling dropdown
   Dropdown active state: true
   ```
4. **Check if dropdown appears** → Should see menu with Profile, Address, etc.

### **Step 3: Test Profile Link**
1. **With dropdown open**, click "Profile"
2. **Check console** → Should see: `Profile link clicked`
3. **Should navigate** to profile.html

### **Step 4: Test Profile Page Loading**
1. **If profile page loads**, check console for:
   ```
   Profile page loaded, initializing...
   Waiting for config...
   Config loaded successfully
   Initializing authentication...
   Session check result: {session: {...}, error: null}
   User authenticated: your-email@example.com
   Loading profile...
   ```

## 🔍 **Common Issues & Solutions**

### **Issue 1: Dropdown Not Opening**
**Symptoms:** Click on name, nothing happens
**Check Console For:**
```
User button or dropdown not found: {userBtn: null, userDropdown: null}
```
**Solution:** 
- Make sure you're signed in
- Refresh the page
- Check if user menu is visible in navbar

### **Issue 2: Profile Link Not Working**
**Symptoms:** Dropdown opens but clicking Profile does nothing
**Check Console For:**
```
Profile link clicked
```
**If not showing:** The link click isn't being detected
**Solution:** Try right-clicking "Profile" → "Open in new tab"

### **Issue 3: Profile Page Redirects to Auth**
**Symptoms:** Profile page immediately redirects to sign-in
**Check Console For:**
```
No active session, redirecting to auth page
```
**Solution:** 
- Sign in again
- Check if session expired
- Clear browser cache and cookies

### **Issue 4: Config Not Loading**
**Symptoms:** Profile page shows alert "Unable to load configuration"
**Check Console For:**
```
Config not available after waiting
```
**Solution:**
- Check if config.js file exists
- Refresh the page
- Check network tab for failed requests

## 🛠️ **Manual Testing Methods**

### **Method 1: Direct URL Access**
1. **Sign in** to your account
2. **Manually type** `your-domain.com/profile.html` in address bar
3. **Press Enter** → Should load profile page
4. **If redirects to auth** → Authentication issue

### **Method 2: Console Testing**
1. **Open console** on main page (after signing in)
2. **Type:** `window.location.href = 'profile.html'`
3. **Press Enter** → Should navigate to profile
4. **Check what happens**

### **Method 3: Check User Session**
1. **Open console** on main page
2. **Type:** `window.config.supabase.auth.getSession()`
3. **Press Enter** → Should show session object
4. **If null/error** → Authentication problem

## 🔧 **Quick Fixes to Try**

### **Fix 1: Clear Browser Data**
1. **Press Ctrl+Shift+Delete** (or Cmd+Shift+Delete on Mac)
2. **Select "All time"**
3. **Check:** Cookies, Cache, Site data
4. **Click "Clear data"**
5. **Refresh and sign in again**

### **Fix 2: Hard Refresh**
1. **Press Ctrl+F5** (or Cmd+Shift+R on Mac)
2. **This clears cache** and reloads everything
3. **Sign in again** and test

### **Fix 3: Try Incognito/Private Mode**
1. **Open incognito window**
2. **Go to your website**
3. **Sign in and test profile**
4. **If works in incognito** → Cache/cookie issue

## 📋 **Debugging Checklist**

### **Before Testing:**
- [ ] Are you signed in? (Check navbar shows your name)
- [ ] Is browser console open? (F12)
- [ ] Have you cleared cache recently?

### **Test Dropdown:**
- [ ] Click on your name in navbar
- [ ] Does dropdown appear?
- [ ] Do you see console messages?
- [ ] Can you see "Profile" option?

### **Test Profile Navigation:**
- [ ] Click "Profile" in dropdown
- [ ] Does it navigate to profile.html?
- [ ] Do you see console messages?
- [ ] Does profile page load or redirect?

### **Test Profile Page:**
- [ ] Does profile page show your info?
- [ ] Are there any console errors?
- [ ] Do statistics load correctly?
- [ ] Does logout button work?

## 🎯 **Expected Working Flow**

### **Successful Flow:**
1. **User signed in** → Navbar shows user name
2. **Click user name** → Dropdown opens with animation
3. **Click "Profile"** → Navigates to profile.html
4. **Profile loads** → Shows user information and statistics
5. **All buttons work** → Edit, Change Password, Logout

### **Console Messages (Success):**
```
Setting up auth event listeners... {userBtn: button, userDropdown: div}
Auth event listeners set up successfully
User button clicked, toggling dropdown
Dropdown active state: true
Profile link clicked
Profile page loaded, initializing...
Config loaded successfully
User authenticated: user@example.com
Loading profile... {user object}
Set display name
Set full name  
Set email
```

## 🚀 **Next Steps**

1. **Follow the testing steps** above
2. **Check console messages** at each step
3. **Report which step fails** and what console shows
4. **Try the quick fixes** if needed

**The profile page should now work correctly with better error handling and debugging!** 🎉
