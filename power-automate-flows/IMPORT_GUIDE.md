# Power Automate Import Guide - GDPR DPA Compliance Flow

Power Automate accepts imports in different ways. Here are **3 methods** to get your flow working:

---

## ✅ METHOD 1: Import Package (.zip file) - RECOMMENDED

This is what you need when Power Automate asks for a .zip file!

### Files You Need
- **GDPR_DPA_Compliance_Flow_Package.zip** ← Use this file!

### Import Steps

1. **Go to Power Automate**
   - Visit: https://make.powerautomate.com

2. **Start Import**
   - Click **"My flows"** in the left menu
   - Click **"Import"** at the top
   - Select **"Import Package (Legacy)"**

3. **Upload the Package**
   - Click **"Upload"**
   - Select: `GDPR_DPA_Compliance_Flow_Package.zip`
   - Click **"Upload"**
   - Wait for package to be analyzed

4. **Configure Import Settings**

   Power Automate will show you what's in the package. For each item:

   **A. Flow/Workflow**
   - Click **"Select during import"**
   - Choose: **"Create as new"**
   - Give it a name: `GDPR DPA Compliance Analysis`

   **B. Connections (3 required)**

   You'll see these connections listed:

   - **SharePoint Online**
     - Click "Select during import"
     - Choose existing connection OR
     - Click "Create new" and sign in to SharePoint

   - **Common Data Service for Apps** (AI Builder)
     - Click "Select during import"
     - Choose existing connection OR
     - Click "Create new" and authorize AI Builder

   - **Microsoft Teams**
     - Click "Select during import"
     - Choose existing connection OR
     - Click "Create new" and sign in to Teams

5. **Complete Import**
   - Once all connections are mapped (green checkmarks)
   - Click **"Import"** button at the bottom
   - Wait for import to complete (usually 30-60 seconds)

6. **⚠️ CRITICAL: Configure OpenAI API Key**
   - After import completes, click **"Open flow"**
   - Flow will open in edit mode
   - Find the action: **"HTTP - Call OpenAI"**
   - Click on it to expand
   - In **Headers** section, find **Authorization**
   - Replace `YOUR_OPENAI_API_KEY_HERE` with your actual key
   - Format: `Bearer sk-proj-xxxxxxxxxxxxxxxxx`
   - Click **"Save"** in the top right

7. **Turn On the Flow**
   - Click **"Turn on"** in the top bar
   - The flow is now active and monitoring your SharePoint folder!

---

## ⚡ METHOD 2: Direct JSON Import (Alternative)

If the package import doesn't work, try this method:

### Steps

1. **Create a New Flow from Blank**
   - Go to https://make.powerautomate.com
   - Click **"+ Create"** → **"Automated cloud flow"**
   - Give it a name and click **"Skip"**

2. **Switch to Code View**
   - In the flow designer, look for the **"Peek code"** button (usually top right)
   - Or click the **"..."** menu → **"Peek code"**

3. **Replace the Definition**
   - Delete all the existing JSON
   - Open `GDPR_DPA_Compliance_Flow.json`
   - Copy the entire contents
   - Paste into the code view

4. **Save and Configure**
   - Click **"Save"**
   - Power Automate will parse the definition
   - You'll need to re-authenticate connections
   - Don't forget to add your OpenAI API key!

---

## 🛠️ METHOD 3: Manual Recreation (Most Reliable)

If both imports fail, you can manually build the flow following the README.md specifications.

### Why Manual Might Be Better
- Ensures all connections work in your environment
- Lets you customize as you go
- Better understanding of the flow structure

### How to Start
1. Follow the flow architecture diagram in README.md
2. Create each action step-by-step
3. Test after each major section
4. Reference the JSON for exact expressions

---

## 🔧 After Import - Configuration Checklist

No matter which method you used, complete these steps:

### 1. ✅ Verify Connections
All three connections should have green checkmarks:
- [ ] SharePoint Online
- [ ] Common Data Service (AI Builder)
- [ ] Microsoft Teams

**Fix**: Click on any action with a connection error → Re-select your connection

### 2. ✅ Configure OpenAI API Key
- [ ] Find action: "HTTP - Call OpenAI"
- [ ] Update Authorization header
- [ ] Replace: `YOUR_OPENAI_API_KEY_HERE`
- [ ] With: `Bearer sk-proj-your-actual-key`

### 3. ✅ Update SharePoint Settings (if different)
If your SharePoint site or folders are different:

- [ ] **Trigger**: Update site URL and folder path
- [ ] **Get file content**: Update site URL
- [ ] **Move file** actions: Update destination paths
- [ ] **Create report file**: Update site and folder path

### 4. ✅ Update Teams Settings (if different)
If using different Team/Channel:

- [ ] Open **"Post message to Teams"** actions
- [ ] Select your Team and Channel
- [ ] Keep the message template or customize it

### 5. ✅ Verify Folder Structure
Ensure these folders exist in SharePoint:

```
/Shared Documents/New DPA Test/DPA General/
    ├── Review Queue/     ← Flow watches this folder
    ├── Processed/        ← Successfully processed PDFs
    ├── Rejected/         ← Non-PDF files
    └── Reports/          ← Analysis reports saved here
```

**How to check**: Go to your SharePoint site → Documents → Navigate to path

### 6. ✅ Test the Flow
- [ ] Turn on the flow
- [ ] Upload a test PDF (3-5 pages) to Review Queue
- [ ] Monitor flow run (My flows → Click flow → Run history)
- [ ] Check Teams for notification
- [ ] Verify report created in Reports folder
- [ ] Confirm PDF moved to Processed folder

---

## 🚨 Common Import Issues & Solutions

### Issue 1: "Invalid package" error
**Solution**:
- Make sure you're using `GDPR_DPA_Compliance_Flow_Package.zip`
- Try downloading the file again (don't extract it)
- Use METHOD 2 instead

### Issue 2: Connections show as "Invalid"
**Solution**:
- After import, edit the flow
- Click on each action with a connection error
- Re-select or create new connection
- Save the flow

### Issue 3: "This workflow is missing connections"
**Solution**:
- This is normal after import
- Edit the flow
- Power Automate will prompt you to fix connections
- Sign in to each service when prompted

### Issue 4: Flow won't save - "Expression error"
**Solution**:
- Check the OpenAI API key format in HTTP action
- Ensure all expressions use `@{}` syntax correctly
- Verify file paths don't have extra quotes

### Issue 5: AI Builder action shows error
**Solution**:
- Verify AI Builder is enabled in your environment
- Check you have AI Builder credits available
- Go to: https://make.powerapps.com → AI Builder
- Ensure your license includes AI Builder

### Issue 6: Can't find my Team/Channel IDs
**Solution**:
- In Teams, click "..." next to channel name
- Select "Get link to channel"
- The URL contains the IDs
- Or just select from dropdown in Power Automate action

---

## 📊 Import Success Indicators

You'll know the import worked when:

✅ Flow appears in "My flows" list
✅ Flow status shows "On" (after you turn it on)
✅ All connections have green checkmarks in flow checker
✅ No errors when you click "Flow checker" (top right)
✅ Test run completes successfully
✅ Teams notification appears after test
✅ Report file created in SharePoint

---

## 🔐 Security Reminder

**⚠️ NEVER commit your actual OpenAI API key to Git!**

- The package uses a placeholder: `YOUR_OPENAI_API_KEY_HERE`
- Replace it AFTER import in Power Automate
- Consider using Azure Key Vault for production
- Rotate keys every 90 days

---

## 📞 Need Help?

### If Import Fails Completely
1. Check the README.md for manual setup instructions
2. Verify your Power Automate license includes:
   - Power Automate Premium (for HTTP action)
   - AI Builder credits (for OCR)
3. Try creating a simple test flow first to verify connections work

### If Flow Runs But Fails
1. Check Run History for specific error messages
2. Verify SharePoint folder structure exists
3. Test OpenAI API key with curl or Postman
4. Ensure AI Builder has credits available

### Documentation References
- **README.md** - Comprehensive setup and configuration guide
- **QUICK_START.md** - 5-minute setup overview
- **GDPR_DPA_Compliance_Flow.json** - Raw flow definition (for reference)

---

## 🎯 Quick Reference

**Package File**: `GDPR_DPA_Compliance_Flow_Package.zip` (3.8 KB)

**Import Method**: My flows → Import → Import Package (Legacy) → Upload .zip

**Required Connections**:
1. SharePoint Online
2. Common Data Service (AI Builder)
3. Microsoft Teams

**Must Configure After Import**:
1. OpenAI API key in HTTP action
2. Connection authentication
3. SharePoint folder paths (if different)

**Test File Location**: Upload PDF to Review Queue folder

**Expected Result**: Teams notification + Report in Reports folder + PDF in Processed folder

---

**Good luck with your import! The flow should be running in under 10 minutes.** 🚀
