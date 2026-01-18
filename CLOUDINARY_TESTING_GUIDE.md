# Cloudinary Integration Testing Guide

## ✅ Pre-Flight Checklist

Before testing, verify:

1. **Environment Variables Set**
   ```bash
   # In server/.env
   CLOUDINARY_URL=cloudinary://314928343976845:UYPCxFhKJLxlx6LA7-adwdsOR8g@dxqu2sqkf
   ```

2. **Dependencies Installed**
   ```bash
   cd server
   npm list express-fileupload cloudinary uuid
   ```

3. **Server Running**
   ```bash
   npm start
   # Should see: ✅ MongoDB connected
   #            🚀 Server started on port 5000
   ```

---

## 🧪 Test 1: Add Candidate with Image Upload

### Steps:
1. Navigate to Admin Dashboard
2. Click **"Add Candidate"**
3. Fill in form:
   - First Name: `John`
   - Last Name: `Doe`
   - Motto: `"Vote for change"`
   - Photo: **Select an image file** (PNG, JPG, or WebP)
4. Click **"Add Candidate"**

### Expected Results:
- ✅ Modal closes after submission
- ✅ New candidate appears in candidates list
- ✅ Image displays in the candidate card
- ✅ Check browser console: No errors
- ✅ Check server console: No upload errors

### Verify in Cloudinary:
1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Check **Media Library → folders → ivote → candidates**
3. You should see the uploaded image with a UUID name

---

## 🧪 Test 2: Create Election with Banner Upload

### Steps:
1. Navigate to Admin Dashboard
2. Click **"Create New Election"**
3. Fill in form:
   - Title: `2024 Student Council Election`
   - Description: `Vote for your next student council`
   - Start: Pick a future date/time
   - End: Pick a later date/time
   - Banner: **Select an image file**
4. Click **"Create Election"**

### Expected Results:
- ✅ Modal closes
- ✅ New election appears in elections list
- ✅ Banner image displays
- ✅ Election details are saved

### Verify in Cloudinary:
1. Check **Media Library → folders → ivote → elections**
2. Verify the banner image is uploaded

---

## 🧪 Test 3: Create News Post with Image

### Steps:
1. Navigate to Admin Dashboard (News section)
2. Create a new news post with these details:
   - Title: `Important Announcement`
   - Content: `Test news content`
   - Upload Image: **Select an image file**
   - Category: Select one
3. Click **"Create Post"**

### Expected Results:
- ✅ News post is created
- ✅ Image displays in the post
- ✅ No errors in console

### Verify in Cloudinary:
1. Check **Media Library → folders → ivote → news**
2. Verify the news image is uploaded

---

## 🔍 Troubleshooting

### Issue: "Image upload failed"
**Solution:**
- Check Cloudinary URL in `.env` is correct
- Verify API credentials are valid
- Check file size (max 50MB)
- Check file type (PNG, JPG, WebP for images)

### Issue: "Unauthorized" error
**Solution:**
- Make sure you're logged in as Admin
- Check token is valid in localStorage
- Refresh page and try again

### Issue: Images display as broken
**Solution:**
- Check Cloudinary URL format
- Verify image is actually uploaded to Cloudinary dashboard
- Check browser console for CORS errors

### Issue: "File is too large"
**Solution:**
- The limit is set to 50MB in `server/index.js`
- Compress image before upload
- Or modify limit in `app.use(fileUpload(...))`

---

## 📊 Database Verification

After uploading, verify images are stored correctly:

```javascript
// MongoDB
db.candidates.find({ firstName: "John" })
// Should show: image: "https://res.cloudinary.com/..."

db.elections.find({ title: "2024 Student Council Election" })
// Should show: thumbnail: "https://res.cloudinary.com/..."
```

---

## 🎯 Performance Optimization

The image transformation features are ready to use:

```javascript
// In your templates/responses, use:
- getCandidatePhotoUrl(publicId)    // 400x400, face-focused
- getElectionBannerUrl(publicId)    // 1200x400, responsive
- getNewsImageUrl(publicId)         // 800x450, responsive
```

These automatically:
- Format based on client capability (WebP, AVIF, etc.)
- Optimize quality
- Resize to dimensions
- Apply auto-crop

---

## ✨ Cleanup (After Migration Complete)

When ready to remove old local uploads:

```bash
node server/scripts/cleanupLocalUploads.js
```

This safely removes:
- `/server/uploads/candidates/`
- `/server/uploads/elections/`

**Important:** Only run after verifying all images are in Cloudinary!

---

## 📝 Next Steps

1. **Test all three scenarios** above
2. **Verify in Cloudinary dashboard** images are uploaded
3. **Check database** images are stored correctly
4. **Test image display** on frontend
5. **Run cleanup script** (optional, after verification)

If everything passes, your Cloudinary integration is complete! 🚀
