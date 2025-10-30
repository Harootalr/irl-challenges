# GDPR DPA Compliance Flow - Power Automate

## Overview
This Power Automate flow provides automated GDPR compliance analysis for Data Processing Agreements (DPAs) at Setterwalls law firm. When a PDF is uploaded to SharePoint, it extracts text with AI Builder, analyzes it with OpenAI GPT-4, and generates a comprehensive compliance report.

## Flow Architecture

```
📥 PDF Upload (SharePoint)
    ↓
🔍 Check if PDF
    ↓
✅ TRUE Branch:
    ├─ Extract text (AI Builder OCR)
    ├─ Analyze with OpenAI GPT-4
    ├─ Aggregate all analyses
    ├─ Move to Processed folder
    ├─ Create report file
    └─ Post summary to Teams

❌ FALSE Branch:
    ├─ Move to Rejected folder
    └─ Post rejection notice to Teams
```

## Import Instructions

### Step 1: Prepare Connections
Before importing, ensure you have the following connections set up in Power Automate:

1. **SharePoint Online**
   - Site: `https://harootal.sharepoint.com/sites/ParalegalAssistant`
   - Permissions: Read/Write access to Document Library

2. **Common Data Service for Apps** (AI Builder)
   - Enable AI Builder in your environment
   - Ensure you have AI Builder credits available

3. **Microsoft Teams**
   - Team: SW - Test
   - Channel: DPA-Comp Test

### Step 2: Import the Flow

1. Open [Power Automate](https://make.powerautomate.com)
2. Click **"My flows"** → **"Import"** → **"Import Package (Legacy)"**
3. Upload the `GDPR_DPA_Compliance_Flow.json` file
4. Select import setup for each connection:
   - SharePoint Online: Select your existing connection or create new
   - Common Data Service for Apps: Select your existing connection or create new
   - Microsoft Teams: Select your existing connection or create new
5. Click **"Import"**

### Step 3: Configure OpenAI API Key

**⚠️ CRITICAL**: The flow requires your OpenAI API key to function.

1. Open the flow in edit mode
2. Find the action **"HTTP - Call OpenAI"**
3. In the **Headers** section, locate the Authorization field
4. Replace `YOUR_OPENAI_API_KEY_HERE` with your actual OpenAI API key
5. Your key should look like: `Bearer sk-proj-xxxxxxxxxx`

**Security Best Practice**: Consider using Azure Key Vault or environment variables instead of hardcoding the API key. See the "OpenAI API Key Security" section below for details.

### Step 4: Configure Connections

After import, edit the flow and update the connection references:

1. Ensure the flow is still in edit mode
2. For each action with a connection error, click to re-select your connection
3. Save the flow

### Step 5: Verify Folder Structure

Ensure these folders exist in SharePoint:
```
/Shared Documents/New DPA Test/DPA General/
    ├── Review Queue/     (Trigger watches here)
    ├── Processed/        (PDFs moved here after analysis)
    ├── Rejected/         (Non-PDFs moved here)
    └── Reports/          (Analysis reports saved here)
```

### Step 6: Test the Flow

1. Turn on the flow
2. Upload a test PDF to the Review Queue folder
3. Monitor the flow run history
4. Check Teams channel for completion message
5. Verify report in Reports folder

## Configuration Details

### Trigger Configuration
- **Type**: When a file is created (properties only)
- **Site**: https://harootal.sharepoint.com/sites/ParalegalAssistant
- **Library ID**: 9ef8d89e-44a9-4997-b58e-97fac2be77b6
- **Folder**: /Shared Documents/New DPA Test/DPA General/Review Queue
- **Recurrence**: Every 1 minute

### AI Builder OCR
- **Model**: prebuilt-read (Text Recognition)
- **Input**: PDF file content (base64 encoded)
- **Output**: Extracted text lines from the document

### OpenAI Integration
- **API Endpoint**: https://api.openai.com/v1/chat/completions
- **Model**: gpt-4o
- **Max Tokens**: 2000
- **Temperature**: 0.3 (for consistent analysis)

### Teams Notification
- **Team ID**: f664e6cd-f837-4ac7-b8d4-115b2031580a
- **Channel ID**: 19:xAYg4GytTIg9DcNaKB74s9W9wFH068XmERIY8gq5H9c1@thread.tacv2

## ⚠️ Important Security Notes

### OpenAI API Key Security

**CRITICAL**: The flow currently contains a hardcoded OpenAI API key in the HTTP action. This is a security risk!

**Recommended alternatives:**

1. **Azure Key Vault** (Best practice):
   ```
   - Store API key in Azure Key Vault
   - Use "Get secret" action before HTTP call
   - Reference the secret in Authorization header
   ```

2. **Environment Variables**:
   ```
   - Create environment variable in Power Platform
   - Reference with: @{environment('OpenAI_API_Key')}
   ```

3. **HTTP with Azure AD Authentication**:
   ```
   - Use Azure OpenAI Service instead of OpenAI API
   - Authenticate with managed identity
   - No API key needed in flow
   ```

**To update the API key location:**
1. Edit the flow
2. Find the "HTTP - Call OpenAI" action
3. Update the Authorization header to reference your secure storage
4. Save and test

### API Key Rotation
- Rotate the OpenAI API key regularly (every 90 days)
- Update in all flows when rotated
- Monitor API usage for anomalies

## Performance Optimization

### Current Design
The flow currently calls OpenAI API **for each line** extracted from the PDF. This can result in:
- High API costs (multiple API calls per document)
- Slow execution (sequential processing)
- Rate limiting issues with OpenAI

### Recommended Optimization

**Option 1: Single API Call** (Recommended)
Instead of analyzing each line separately, combine all text first:

```
1. Extract all text with AI Builder
2. Use Compose action to join all lines:
   join(body('Recognize_text')?['results'][0]?['pages'][0]?['lines'], ' ')
3. Make ONE OpenAI API call with full text
4. Parse single comprehensive analysis
```

**Option 2: Batch Processing**
Group lines into chunks (e.g., paragraphs or sections):

```
1. Extract text
2. Create variable for text chunks
3. Append lines until chunk reaches size limit
4. Call OpenAI for each chunk
5. Aggregate chunk analyses
```

**Estimated Cost Savings:**
- Current: 50-200 API calls per document
- Optimized: 1-5 API calls per document
- Cost reduction: 90-95%
- Speed improvement: 10-20x faster

## Troubleshooting

### Issue: Flow fails at "Recognize text in PDF"
**Solution**:
- Verify AI Builder is enabled in your environment
- Check AI Builder credits availability
- Ensure PDF is not corrupted or password-protected

### Issue: "Append to AllAnalyses" shows empty array
**Solution**:
- Check OpenAI API key is valid
- Verify HTTP action returns successful response
- Check Parse JSON schema matches OpenAI response

### Issue: File not moving to Processed folder
**Solution**:
- Verify destination folder exists
- Check SharePoint permissions
- Ensure file is not locked/checked out

### Issue: Teams message not posting
**Solution**:
- Verify Team and Channel IDs are correct
- Check Teams connection permissions
- Test with a simple message first

### Issue: Report file not creating
**Solution**:
- Check Reports folder exists
- Verify SharePoint connection has write permissions
- Ensure file name doesn't exceed length limit

## Flow Variables

| Variable | Type | Purpose |
|----------|------|---------|
| AllAnalyses | Array | Stores all OpenAI analysis responses for aggregation |

## Dynamic Content Reference

### Available from Trigger
- `triggerOutputs()?['body/{FilenameWithExtension}']` - Full filename
- `triggerOutputs()?['body/{FilenameWithoutExtension}']` - Name without .pdf
- `triggerOutputs()?['body/{Identifier}']` - Unique file ID
- `triggerOutputs()?['body/ID']` - SharePoint item ID
- `triggerOutputs()?['body/Author']?['DisplayName']` - Uploader name

### Available from Actions
- `outputs('Get_file_content')?['body']` - PDF binary content
- `outputs('Recognize_text_in_PDF')?['results']` - OCR results
- `variables('AllAnalyses')` - Array of all analyses
- `outputs('Compose_all_analyses')` - Joined analysis text
- `outputs('Create_report_file')?['body/Id']` - Report file ID

## Monitoring & Analytics

### Key Metrics to Track
1. **Flow Run Success Rate**: Target >95%
2. **Average Execution Time**: Current ~5-15 min per PDF
3. **OpenAI API Calls per Document**: Current ~50-200
4. **AI Builder Credits Used**: ~1 credit per page
5. **Files Processed per Day**: Monitor for capacity planning

### View Flow Analytics
1. Go to flow details page
2. Click "Analytics" tab
3. Review:
   - Runs over time
   - Success/failure rate
   - Average duration
   - Action success rates

## Cost Estimation

### Per Document Processing Cost

**AI Builder (OCR)**:
- ~1 AI Builder credit per page
- 10-page document = 10 credits
- Cost: ~$0.10 - $1.00 per document

**OpenAI API (Current design)**:
- 50-200 API calls per document
- GPT-4o: $0.005/1K input + $0.015/1K output tokens
- Estimated: $2-10 per document

**OpenAI API (Optimized design)**:
- 1-5 API calls per document
- Estimated: $0.10-$0.50 per document

**Total per document**:
- Current: $2.10 - $11.00
- Optimized: $0.20 - $1.50

## Maintenance Schedule

### Weekly
- Review flow run history for failures
- Check Teams notifications are posting correctly

### Monthly
- Review OpenAI API usage and costs
- Check AI Builder credit consumption
- Verify folder sizes and archive old reports

### Quarterly
- Rotate OpenAI API key
- Review and optimize flow performance
- Update GDPR analysis prompt if needed
- Test with sample DPAs

## Support & Documentation

### Power Automate Resources
- [Power Automate Documentation](https://docs.microsoft.com/power-automate/)
- [AI Builder Documentation](https://docs.microsoft.com/ai-builder/)
- [SharePoint Connector](https://docs.microsoft.com/connectors/sharepointonline/)

### OpenAI Resources
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [GPT-4 Best Practices](https://platform.openai.com/docs/guides/gpt-best-practices)

### GDPR Resources
- [GDPR Official Text](https://gdpr-info.eu/)
- [DPA Requirements](https://gdpr-info.eu/art-28-gdpr/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-30 | Initial release with full DPA analysis workflow |

## License & Disclaimer

This flow is provided as-is for use by Setterwalls law firm. The GDPR compliance analysis is automated but should be reviewed by qualified legal professionals. The AI analysis is a tool to assist, not replace, legal expertise.

## Future Enhancements

1. **Batch Processing**: Optimize to single API call per document
2. **Classification**: Auto-detect DPA type and apply specialized analysis
3. **Risk Scoring Dashboard**: Power BI dashboard for compliance trends
4. **Email Notifications**: Send detailed report via email to stakeholders
5. **Version Comparison**: Compare DPA versions to track changes
6. **Approval Workflow**: Add human-in-the-loop approval step for high-risk DPAs
7. **Integration with Contract Management**: Sync with Setterwalls CMS
8. **Multi-language Support**: Analyze DPAs in Swedish, English, etc.

---

**For support, contact the Integritetssmart team.**
