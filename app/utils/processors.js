/**
 * Data Processing Utilities
 *
 * Functions to transform raw Zoho API responses into the structures
 * needed by the Vuex store and components.
 */
import {
  FIELD_PROJECT_STAGE_LOOKUP,
  FIELD_PROJECT_TAGS,
  FIELD_PROJECT_TRANCHE_LOOKUP,
  FIELD_PROJECT_IS_DEMO,
  FIELD_STAGE_ACTIVE_STATUS,
  FIELD_STAGE_NAME,
  FIELD_STAGE_VIEW,
  FIELD_STAGE_ORDER,
  FIELD_STAGE_ID,
  FIELD_PROJECT_PRE_SALE_STAGE_ID,
  FIELD_TAG_ACTIVE_STATUS,
  FIELD_TAG_ID,
  FIELD_TAG_NAME,
  FIELD_TAG_COLOR,
  FIELD_TAG_CATEGORY,
  FIELD_TAG_DESCRIPTION,
  FIELD_SALES_REP_ID,
  FIELD_SALES_REP_NAME,
  FIELD_SALES_ORG_ID,
  FIELD_SALES_ORG_NAME,
  FIELD_TRANCHE_ID,
  FIELD_TRANCHE_NUMBER
} from '../config/constants.js';
// --- ADD Import for EVENT_TYPES ---
import { EVENT_TYPES } from '../config/options.js';


// Import constants needed for DocTypes
import { REPORT_DOC_TYPES } from '../config/constants.js'; 

const DataProcessors = {

  /**
   * Processes the raw API response for fetching stages.
   * Filters for active stages, extracts relevant fields, and sorts by order.
   * @param {object} stagesResponse - The raw response object from ZOHO.CREATOR.DATA.getRecords for stages.
   * @returns {Array<object>} An array of processed stage objects, sorted by order.
   *                           Returns an empty array if the response is invalid or contains no data.
   *                           Shape: [{ id: String, title: String, view: String, description: String, order: Number }, ...]
   */
  processStagesData(stagesResponse) {
    // // console.log('DataProcessors: Processing Stages Response:', stagesResponse);
    if (!stagesResponse || stagesResponse.code !== 3000 || !Array.isArray(stagesResponse.data)) {
      console.warn('DataProcessors: Invalid or empty stages response received.', stagesResponse);
      return [];
    }

    try {
      const processedStages = stagesResponse.data
        .filter(stage => 
            stage[FIELD_STAGE_ACTIVE_STATUS] === "true" && 
            stage[FIELD_STAGE_ID] !== FIELD_PROJECT_PRE_SALE_STAGE_ID
        )
        .map(stage => ({
          id: stage[FIELD_STAGE_ID], // Use constant (system field)
          title: stage[FIELD_STAGE_NAME] || 'Unnamed Stage', // Use constant
          view: stage[FIELD_STAGE_VIEW] || 'Unknown', // Use constant
          description: stage.Description || "", // Add constant if defined
          // Safely parse Stage_Order, defaulting to a high number if invalid/missing to sort last
          order: parseInt(stage[FIELD_STAGE_ORDER], 10) || 9999, // Use constant
        }))
        .sort((a, b) => a.order - b.order); // Sort by order ascending

      // // console.log('DataProcessors: Processed Stages:', processedStages);
      return processedStages;
    } catch (error) {
      console.error('DataProcessors: Error processing stages data:', error);
      return []; // Return empty array on error
    }
  },

  /**
   * Processes an array of raw project records fetched for the Kanban board.
   * Extracts relevant fields for display and state management.
   * Uses original API field names where appropriate.
   * @param {Array<object>} rawProjectsData - Array of raw project record objects from Zoho API.
   * @returns {Array<object>} An array of processed project objects.
   */
  processProjectsData(rawProjectsData) {
    // console.log(`DataProcessors: Processing ${rawProjectsData?.length || 0} raw project records.`);
    if (!Array.isArray(rawProjectsData)) {
      console.warn('DataProcessors: Invalid input for processProjectsData, expected an array.');
      return [];
    }

    try {
      const processedProjects = rawProjectsData.map(record => {
          // Use constants for field names where available
          const project = {
              ID: record.ID, // System field
              Owner_Name_Display: record.Owner_Name?.zc_display_value?.trim() || "No Contact",
              Owner_Phone: record["Owner_Name.Phone_Number"] || "", 
              Owner_Email: record["Owner_Name.Email"] || "", 
              addressLine1: record.Site_Address?.address_line_1 || "",
              city: record.Site_Address?.district_city || "",
              state: record.Site_Address?.state_province || "",
              zip: record.Site_Address?.postal_Code || "",
              latitude: record.Site_Address?.latitude || "",
              longitude: record.Site_Address?.longitude || "",
              // Pass raw value directly, parsing will happen where needed
              kW_STC: record.kW_STC, 
              New_Stage: { // Process into the expected object structure
                  ID: record[FIELD_PROJECT_STAGE_LOOKUP]?.ID || null,
                  title: record[FIELD_PROJECT_STAGE_LOOKUP]?.zc_display_value || 'Unknown Stage',
                  display_value: record[FIELD_PROJECT_STAGE_LOOKUP]?.zc_display_value || 'Unknown Stage'
              },
              Sales_Rep_Name: record.Sales_Rep?.zc_display_value?.trim() || "", // Renamed from _Display
              Sales_Org_Name: record.Sales_Org?.zc_display_value?.trim() || "", // Renamed from _Display
              Need_Help: record.Need_Help === "true", 
              Commercial: record.Commercial === "true", 
              Is_Cash_Finance: record.Is_Cash_Finance === "true", 
              Is_Approved: record.Is_Approved === "true", 
              // Pass raw value directly
              Yield: record.Yield, 
              Tags: record[FIELD_PROJECT_TAGS], 
              Date_Sold: record.Date_Sold || "", 
              Is_Demo: record[FIELD_PROJECT_IS_DEMO] === "true", 
              installDate: record.Install_Date || "", 
              Installation_Date_Time: record.Installation_Date_Time || "", 
              Added_Time: record.Added_Time || "",
              Modified_Time: record.Modified_Time || "",
              Tranche: record[FIELD_PROJECT_TRANCHE_LOOKUP], 
              Roof_Type: record.Roof_Type || "", 
              // Derive boolean flags directly here for simplicity in components, using API names as keys
              Roof_Work_Required: record.Survey_Results?.[0]?.Roof_Work_Required === "Yes",
              Tree_Work_Required: record.Survey_Results?.[0]?.Tree_Work_Required === "Yes",
              Panel_Upgrade_Required: record.Survey_Results?.[0]?.Panel_Upgrade_Required === "Yes",
              // Pass raw statuses
              Roof_Work_Status: record.Roof_Work_Status || "",
              Tree_Work_Status: record.Tree_Work_Status || "",
              PU_Work_Status: record.PU_Work_Status || "",
              // Keep derived statuses but use API naming convention
              Permit_Status: record.Permitting?.[0]?.Permit_Status || "",
              Interconnection_Status: record.Permitting?.[0]?.Interconnection_Status || "",
              // Include other relevant raw fields or lookups
              Sales_Org: record.Sales_Org, 
              Survey_Results: record.Survey_Results, 
              OpenSolar_Project_ID: record.OpenSolar_Project_ID || "", // Add OpenSolar ID
          };
          // Add formatted address for easier searching
          const addressParts = [project.addressLine1, project.city, project.state, project.zip];
          project.address = addressParts.filter(Boolean).join(', ');
          return project;
      });

       console.log(`DataProcessors: Processed Projects:`, processedProjects);
      return processedProjects;

    } catch (error) {
        console.error('DataProcessors: Error processing projects data:', error);
        return []; // Return empty array on error
    }
  },

  /**
   * Processes the raw API response for fetching Sales Reps.
   * Extracts ID and Name, filters out those without names, sorts alphabetically.
   * @param {object} salesRepsResponse - Raw response from ZOHO.CREATOR.DATA.getRecords.
   * @returns {Array<object>} Array of processed sales rep objects: [{ id: String, name: String }, ...]
   */
  processSalesRepsData(salesRepsResponse) {
    // console.log('DataProcessors: Processing Sales Reps Response:', salesRepsResponse);
    if (!salesRepsResponse || salesRepsResponse.code !== 3000 || !Array.isArray(salesRepsResponse.data)) {
      console.warn('DataProcessors: Invalid or empty sales reps response received.', salesRepsResponse);
      return [];
    }
    try {
        return salesRepsResponse.data
            .map(rep => ({
                id: rep[FIELD_SALES_REP_ID], // Use constant (system field)
                name: rep[FIELD_SALES_REP_NAME]?.zc_display_value?.trim() || '' // Use constant
                // Add other fields like email, org if needed elsewhere
            }))
            .filter(rep => rep.name) // Filter out reps without a display name
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error('DataProcessors: Error processing sales reps data:', error);
        return [];
    }
  },

  /**
   * Processes the raw API response for fetching Sales Orgs.
   * Extracts ID and Name, filters out those without names, sorts alphabetically.
   * Assumes report has fields ID and Org_Name.
   * @param {object} salesOrgsResponse - Raw response from ZOHO.CREATOR.DATA.getRecords.
   * @returns {Array<object>} Array of processed sales org objects: [{ id: String, name: String }, ...]
   */
   processSalesOrgsData(salesOrgsResponse) {
    // console.log('DataProcessors: Processing Sales Orgs Response:', salesOrgsResponse);
    if (!salesOrgsResponse || salesOrgsResponse.code !== 3000 || !Array.isArray(salesOrgsResponse.data)) {
      console.warn('DataProcessors: Invalid or empty sales orgs response received.', salesOrgsResponse);
      return [];
    }
    try {
        return salesOrgsResponse.data
            .map(org => ({
                id: org[FIELD_SALES_ORG_ID], // Use constant (system field)
                name: org[FIELD_SALES_ORG_NAME]?.trim() || '' // Use constant
            }))
            .filter(org => org.name)
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error('DataProcessors: Error processing sales orgs data:', error);
        return [];
    }
  },

  /**
   * Processes the raw API response for fetching Tags.
   * Filters for active tags, extracts relevant fields, and returns a Map.
   * @param {object} tagsResponse - Raw response from ZOHO.CREATOR.DATA.getRecords.
   * @returns {Map<String, object>} Map of tag ID to tag object: { name, color, category, description }
   */
  processTagsData(tagsResponse) {
    // console.log('DataProcessors: Processing Tags Response:', tagsResponse);
     if (!tagsResponse || tagsResponse.code !== 3000 || !Array.isArray(tagsResponse.data)) {
      console.warn('DataProcessors: Invalid or empty tags response received.', tagsResponse);
      return new Map();
    }
    try {
        const tagsMap = new Map();
        tagsResponse.data
            .filter(tag => tag[FIELD_TAG_ACTIVE_STATUS] === "true") // Use constant
            .forEach(tag => {
                const tagId = tag[FIELD_TAG_ID]; // Use constant (system field)
                tagsMap.set(tagId, {
                    id: tagId, // Also store id inside object for convenience?
                    name: tag[FIELD_TAG_NAME]?.trim() || 'Unnamed Tag', // Use constant
                    color: tag[FIELD_TAG_COLOR] || '#9CA3AF', // Use constant
                    category: tag[FIELD_TAG_CATEGORY] || 'General', // Use constant
                    description: tag[FIELD_TAG_DESCRIPTION] || "" // Use constant
                });
            });
        // console.log('DataProcessors: Processed Tags Map:', tagsMap);
        return tagsMap;
     } catch (error) {
        console.error('DataProcessors: Error processing tags data:', error);
        return new Map();
    }
  },

  /**
   * Processes the raw API response for fetching Tranches.
   * Extracts ID and Tranche_Number, sorts numerically.
   * @param {object} tranchesResponse - Raw response from ZOHO.CREATOR.DATA.getRecords.
   * @returns {Array<object>} Array of processed tranche objects: [{ id: String, number: Number, ... (other fields) }, ...]
   */
  processTranchesData(tranchesResponse) {
    // console.log('DataProcessors: Processing Tranches Response:', tranchesResponse);
    if (!tranchesResponse || tranchesResponse.code !== 3000 || !Array.isArray(tranchesResponse.data)) {
      console.warn('DataProcessors: Invalid or empty tranches response received.', tranchesResponse);
      return [];
    }
    try {
        return tranchesResponse.data
            .map(tranche => ({
                id: tranche[FIELD_TRANCHE_ID], // Use constant (system field)
                number: parseInt(tranche[FIELD_TRANCHE_NUMBER], 10) || 0, // Use constant
                // Add any other relevant fields from your Tranche report here
                // name: tranche.Tranche_Name || `Tranche ${tranche.Tranche_Number}`,
                // status: tranche.Status,
            }))
            .sort((a, b) => a.number - b.number); // Sort by tranche number ascending
    } catch (error) {
        console.error('DataProcessors: Error processing tranches data:', error);
        return [];
    }
  },

  /**
   * Processes the raw API response for fetching Document Types.
   * @param {object} docTypesResponse - The raw response object or just the data array.
   * @returns {Array<object>} Array of processed doc type objects: [{ ID, Name, Include_In_Checklist }, ...]
   */
  processDocTypesData(docTypesResponse) {
    // Handle receiving either the full response object or just the data array
    const data = Array.isArray(docTypesResponse?.data) 
        ? docTypesResponse.data 
        : (Array.isArray(docTypesResponse) ? docTypesResponse : []);
        
    if (docTypesResponse?.code && docTypesResponse.code !== 3000 && !Array.isArray(docTypesResponse)) {
         console.warn('DataProcessors: Invalid doc types response object received.', docTypesResponse);
         return [];
    }
    if (!Array.isArray(data)) {
        console.warn('DataProcessors: Invalid doc types data received.', data);
        return [];
    }

    try {
        return data.map(type => ({
            ID: type.ID,
            Name: type.Name || 'Unnamed Type',
            Include_In_Checklist: type.Include_In_Checklist === 'true' // Convert string to boolean
        }));
    } catch (error) {
        console.error('DataProcessors: Error processing document types data:', error);
        return [];
    }
  },

  // --- ADD Processor for Email Templates ---
  processEmailTemplatesData(emailTemplatesResponse) {
    // Handle receiving either the full response object or just the data array
    const data = Array.isArray(emailTemplatesResponse?.data) 
        ? emailTemplatesResponse.data 
        : (Array.isArray(emailTemplatesResponse) ? emailTemplatesResponse : []);

    if (emailTemplatesResponse?.code && emailTemplatesResponse.code !== 3000 && !Array.isArray(emailTemplatesResponse)) {
         console.warn('DataProcessors: Invalid email templates response object received.', emailTemplatesResponse);
         return [];
    }
    if (!Array.isArray(data)) {
        console.warn('DataProcessors: Invalid email templates data received.', data);
        return [];
    }

  // console.log(`DataProcessors: Processing ${data.length} raw email templates.`);
    try {
        const processedTemplates = data
            .filter(template => 
                template.Active_Status === 'true' && 
                template.Template_Type === 'Manual'
            )
            .map(template => {
                // Determine recipient description based on Send_to_Sales_Rep
                const sendToRep = template.Send_to_Sales_Rep === 'true';
                const recipientDesc = sendToRep 
                    ? 'Sent to project contact and sales rep' 
                    : 'Sent to project contact';
                
                return {
                    id: template.ID,
                    name: template.Template_Name || 'Unnamed Template',
                    description: recipientDesc, // Use dynamic description
                    subject: template.Template_Subject || '',
                    // --- ADD Title and Body for Preview ---
                    title: template.Title || '', 
                    body: template.Preliminary_Body || '' 
                };
            });
            
      // console.log(`DataProcessors: Found ${processedTemplates.length} active manual email templates after processing.`);
        return processedTemplates;

    } catch (error) {
        console.error('DataProcessors: Error processing email templates data:', error);
        return [];
    }
  },

  // --- Placeholder for other processing functions ---
  processProjectDetailsData(projectResponse, contactsResponse) {
    console.log('DataProcessors: Starting detailed processing for:', projectResponse?.ID);
    if (!projectResponse) {
      console.warn('DataProcessors: processProjectDetailsData called without projectResponse.');
      return null;
    }

    try {
        // Start with the raw project details
        const processedData = { ...projectResponse };
        const rawNotes = processedData.Notes || [];
        const rawAttachments = processedData.Note_Attachments || []; // Get attachments

        // --- 1. Ensure Related Lists are Arrays (Keep Existing) --- 
        const relatedListKeys = [
            'Activities', 'Communication', 'Documents', 'Bill_of_Materials', 
            'Permitting', 'Survey_Results', 'Issues', 'Tags', 'Contacts1',
            'Tasks',
            // Remove Notes/Note_Attachments from here if handled separately below
        ];
        relatedListKeys.forEach(key => {
            if (!(key in processedData) || processedData[key] === null || processedData[key] === undefined) {
                processedData[key] = [];
            } else if (!Array.isArray(processedData[key])) {
                 console.warn(`DataProcessors: Expected array for related list '${key}', but got ${typeof processedData[key]}. Setting to empty array.`);
                 processedData[key] = [];
            }
        });
        // Ensure Notes and Attachments are arrays even if not in the list above
        processedData.Notes = Array.isArray(rawNotes) ? rawNotes : [];
        processedData.Note_Attachments = Array.isArray(rawAttachments) ? rawAttachments : [];

        // --- 2. Add Separately Fetched Contacts (Keep Existing) --- 
        processedData.Contacts = Array.isArray(contactsResponse) ? contactsResponse : [];

        // --- 3. Process Specific Project Fields (Keep Existing) --- 
        const fieldsToProcess = {
            // Booleans (from checkbox strings)
            Is_Cash_Finance: val => val === 'true',
            Commercial: val => val === 'true',
            Is_Approved: val => val === 'true',
            Need_Help: val => val === 'true',
            Funded_By_Redball: val => val === 'true',
            Is_PPA: val => val === 'true',
            Domestic_Content: val => val === 'true',
            PTO_Funded: val => val === 'true',
            Yield_Less: val => val === 'true',
            // Numbers (from strings)
            kW_STC: val => parseFloat(val) || 0,
            Annual_Usage: val => parseFloat(val) || 0,
            Annual_Output_kWh: val => parseFloat(val) || 0,
            Project_Cost: val => parseFloat(val) || 0,
            Calculated_Project_Cost: val => parseFloat(val) || 0,
            Investor_M1_Payment: val => parseFloat(val) || 0,
            Investor_M2_Payment: val => parseFloat(val) || 0,
            Investor_M3_Payment: val => parseFloat(val) || 0,
            Applicable_Rate: val => parseFloat(val) || 0,
            PPA_Rate: val => parseFloat(val) || null, // Allow null for PPA rate
            Rate_Year: val => val ? parseInt(val, 10) : null,
            Active_Commission_Rate: val => parseFloat(val) || 0,
            M1_Amount: val => parseFloat(val) || 0,
            M2_Amount: val => parseFloat(val) || 0,
            M3_Amount: val => parseFloat(val) || 0,
            Total_Commission_Advance: val => parseFloat(val) || 0,
            Revision_Number: val => val ? parseInt(val, 10) : null, 
            // Ensure Lookups are objects or null
            New_Stage: val => val && val.ID ? val : null,
            Tranche: val => val && val.ID ? val : null,
            Owner_Name: val => val && val.ID ? val : null,
            Sales_Rep: val => val && val.ID ? val : null,
            Sales_Org: val => val && val.ID ? val : null,
            // Dates remain strings
        };

        for (const key in fieldsToProcess) {
            if (processedData.hasOwnProperty(key)) {
                processedData[key] = fieldsToProcess[key](processedData[key]);
            }
        }
        
        // --- 4. Process Notes, Attachments, and Threading --- 
      // console.log(`DataProcessors: Processing ${processedData.Notes.length} notes and ${processedData.Note_Attachments.length} attachments.`);
        const attachmentsByNoteId = new Map();
        const notesById = new Map();

        // 4a. Process and Group Attachments
        processedData.Note_Attachments.forEach(att => {
            const noteId = att.Note?.ID;
            if (!noteId) return; // Skip attachments without a parent note ID

            const fileName = att.Name || '';
            const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
            const fileType = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension) ? 'image' : 'file';
            
            // Prioritize Image field for URL if it exists, otherwise use File_field
            const rawUrl = att.Image || att.File_field;

            // --- Process URL: Prepend domain if it's a relative path --- 
            let processedUrl = rawUrl;
            if (rawUrl && typeof rawUrl === 'string' && rawUrl.startsWith('/api/')) {
                processedUrl = `https://creator.zoho.com${rawUrl}`;
              // console.log(`DataProcessors: Prepended domain to relative URL: ${processedUrl}`); // Keep commented
            } else if (!rawUrl) {
                // Log warning if BOTH fields are empty/missing
                // console.warn(`Could not get URL for attachment ${att.ID} (${fileName}). Image: '${att.Image || ''}', File_field: '${att.File_field || ''}'`); // REMOVE Warning
            }
            // --- End URL Processing ---

            const processedAttachment = {
                id: att.ID,
                name: fileName,
                url: processedUrl || null, // Use processed URL or null if still empty
                type: fileType,
                addedTime: att.Added_Time // Keep original timestamp if needed
            };

            // --- Only add attachment if it has a valid URL --- 
            if (processedAttachment.url) {
                if (!attachmentsByNoteId.has(noteId)) {
                    attachmentsByNoteId.set(noteId, []);
                }
                attachmentsByNoteId.get(noteId).push(processedAttachment);
            } else {
                 // Optionally log skipped attachments (but without the warning)
                 // console.log(`Skipping attachment ${att.ID} (${fileName}) due to missing URL.`);
            }
        });
        
        // 4b. Process Notes (First Pass: Cleanup, Add Attachments)
        processedData.Notes.forEach(note => {
            const processedNote = {
                ...note, // Spread original fields
                id: note.ID, // Ensure consistent id field
                // Basic field cleanup
                content: note.Note || '',
                author: note.User_Lookup?.zc_display_value?.trim() || note.Author || 'Unknown User',
                addedTime: note.Added_Time,
                department: note.Department || null,
                context: note.Context || 'General', // Default context if empty
                teamOnly: note.Team_Only === 'true',
                notifySales: note.Notify_Sales === 'true',
                repliedTo: note.Replied_To?.ID || null,
                taggedUsers: Array.isArray(note.Tagged_Users) ? note.Tagged_Users : [],
                // Add processed attachments
                attachments: attachmentsByNoteId.get(note.ID) || [],
                // Initialize replies array
                replies: [],
                isReply: !!(note.Replied_To?.ID) // Flag if it's a reply
            };
            notesById.set(note.ID, processedNote);
        });

        // 4c. Build Reply Threads
        const topLevelNotes = [];
        notesById.forEach(note => {
            if (note.repliedTo) {
                const parentNote = notesById.get(note.repliedTo);
                if (parentNote) {
                    parentNote.replies.push(note);
                } else {
                    // Orphaned reply? Add to top level for visibility
                    console.warn(`Note ${note.id} is a reply to non-existent parent ${note.repliedTo}. Adding as top-level.`);
                    topLevelNotes.push(note);
                }
            } else {
                topLevelNotes.push(note);
            }
        });

        // 4d. Sort Replies within each thread
        notesById.forEach(note => {
            if (note.replies.length > 0) {
                note.replies.sort((a, b) => new Date(b.addedTime) - new Date(a.addedTime)); // Descending for replies
            }
        });

        // 4e. Sort Top-Level Notes (Descending)
        topLevelNotes.sort((a, b) => new Date(b.addedTime) - new Date(a.addedTime));

        // 4f. Split into Context Arrays
        processedData.General_Notes = [];
        processedData.Commission_Notes = [];
        processedData.Investor_Notes = [];
        processedData.Other_Notes = []; // For notes with other/empty contexts

        topLevelNotes.forEach(note => {
            switch (note.context) {
                case 'General':
                    processedData.General_Notes.push(note);
                    break;
                case 'Commissions':
                    processedData.Commission_Notes.push(note);
                    break;
                case 'Investor':
                    processedData.Investor_Notes.push(note);
                    break;
                default:
                    // Add notes with empty or unknown context to Other_Notes
                    processedData.Other_Notes.push(note);
                    break;
            }
        });
        
      // console.log(`DataProcessors: Finished note processing. General: ${processedData.General_Notes.length}, Commission: ${processedData.Commission_Notes.length}, Investor: ${processedData.Investor_Notes.length}, Other: ${processedData.Other_Notes.length}`);
        // --- End Note Processing --- 
        
        // --- 5. Other Related List Processing (e.g., Sorting Activities) ---
        if (Array.isArray(processedData.Activities) && processedData.Activities.length > 0) {
             processedData.Activities.sort((a, b) => {
                const timeA = a.Added_Time ? new Date(a.Added_Time).getTime() : 0;
                const timeB = b.Added_Time ? new Date(b.Added_Time).getTime() : 0;
                const validTimeA = isNaN(timeA) ? 0 : timeA;
                const validTimeB = isNaN(timeB) ? 0 : timeB;
                return validTimeB - validTimeA; // Descending order
             });
             // console.log("DataProcessors: Sorted Activities by Added_Time (desc)");
        }
        // Add sorting for Communication, Documents etc. if needed
        if (Array.isArray(processedData.Communications) && processedData.Communications.length > 0) {
            processedData.Communications.sort((a, b) => {
                // Helper to get a valid timestamp or 0
                const getTime = (comm) => {
                    const timeStr = comm.SMS_Sent_Time || comm.Email_Sent_Time || comm.Call_Start_Time || comm.Added_Time;
                    if (!timeStr) return 0;
                    try {
                        const time = new Date(timeStr).getTime();
                        return isNaN(time) ? 0 : time;
                    } catch (e) {
                        return 0;
                    }
                };
                return getTime(a) - getTime(b); // Ascending order (oldest first)
            });
            // console.log("DataProcessors: Sorted Communications by time (asc)");
        }
        
        // --- Process Bill of Materials --- 
        processedData.Bill_of_Materials = Array.isArray(processedData.Bill_of_Materials) ? 
            processedData.Bill_of_Materials.map(mat => ({
                ID: mat.ID,
                Category: mat.Category || 'Other Component',
                Manufacturer: mat.Manufacturer || 'Unknown',
                Model: mat.Model || 'Unknown',
                Quantity: parseInt(mat.Quantity, 10) || 0, // Parse as integer
                Unit_Price: parseFloat(mat.Unit_Price) || 0, // Parse as float
                Total_Price: parseFloat(mat.Total_Price) || 0, // Parse as float
                // Keep other fields if needed, e.g., for display or future use
                // Added_Time: mat.Added_Time,
                // Added_User: mat.Added_User
            })) 
            : [];
        // --- End Bill of Materials Processing ---
        
        // --- ADD Survey Results Processing and Sorting ---
        processedData.Survey_Results = Array.isArray(processedData.Survey_Results) ? 
            processedData.Survey_Results.map(survey => {
                const reportId = survey.Report_PDF_ID;
                const reportUrl = reportId ? `https://workdrive.zoho.com/file/${reportId}` : null; // Construct URL

                // Helper to safely parse MM/DD/YY or return 0 for sorting
                const parseDateForSort = (dateString) => {
                    if (!dateString) return 0;
                    try {
                        // Handle potential MM/DD/YY format from Zoho
                        const parts = dateString.split('/');
                        if (parts.length === 3) {
                           // Construct YYYY-MM-DD for reliable parsing
                           const year = parseInt(parts[2], 10);
                           const fullYear = year < 70 ? 2000 + year : 1900 + year; // Basic 2-digit year assumption
                           const month = parts[0].padStart(2, '0');
                           const day = parts[1].padStart(2, '0');
                           const isoDateString = `${fullYear}-${month}-${day}`;
                           const date = new Date(isoDateString + 'T00:00:00'); // Avoid timezone shifts
                           return isNaN(date.getTime()) ? 0 : date.getTime();
                        }
                        // Try parsing directly if not MM/DD/YY
                        const directDate = new Date(dateString);
                        return isNaN(directDate.getTime()) ? 0 : directDate.getTime();
                    } catch (e) {
                         console.warn(`Could not parse date string for sorting: ${dateString}`, e);
                        return 0;
                    }
                };

                return {
                    // Keep original fields needed in the component
                    ID: survey.ID,
                    Assessment_Date: survey.Assessment_Date, // Keep raw string for display formatting
                    Main_Service_Panel_Size: survey.Main_Service_Panel_Size || '',
                    Modified_Time: survey.Modified_Time || '', // Keep for last updated display & sorting fallback
                    Panel_Upgrade_Required: survey.Panel_Upgrade_Required || 'No', // Keep string value for select binding
                    Report_PDF_ID: reportId, // Keep the ID if needed elsewhere
                    Roof_Condition: survey.Roof_Condition || '',
                    Roof_Type: survey.Roof_Type || '',
                    Roof_Work_Required: survey.Roof_Work_Required || 'No', // Keep string value
                    Send_Final_Summary: survey.Send_Final_Summary === 'true', // Convert string to boolean
                    Summary_Notes: survey.Summary_Notes || '',
                    Summary_Sent: survey.Summary_Sent || null, // Keep raw string/null date for display check
                    Tree_Trimming_Required: survey.Tree_Trimming_Required || 'No', // Keep raw string value
                    Tree_Work_Required: survey.Tree_Work_Required || 'No', // Keep string value
                    
                    // Add derived/processed fields
                    Report_URL: reportUrl, // The constructed URL
                    hasReport: !!reportId, // Boolean flag
                    requiresWork: survey.Tree_Work_Required === 'Yes' || 
                                  survey.Roof_Work_Required === 'Yes' || 
                                  survey.Panel_Upgrade_Required === 'Yes', // Boolean flag for quick checks
                    // Add parsed timestamps for reliable sorting
                    _assessmentTimestamp: parseDateForSort(survey.Assessment_Date),
                    _modifiedTimestamp: survey.Modified_Time ? new Date(survey.Modified_Time).getTime() : 0,
                };
            }).sort((a, b) => {
                // Sort by Assessment_Date descending, fallback to Modified_Time descending
                if (b._assessmentTimestamp !== a._assessmentTimestamp) {
                    return b._assessmentTimestamp - a._assessmentTimestamp;
                }
                if (b._modifiedTimestamp !== a._modifiedTimestamp) {
                    return b._modifiedTimestamp - a._modifiedTimestamp;
                }
                 // Final fallback sort by ID descending
                return (b.ID || '').localeCompare(a.ID || '');
              }) 
            : [];
        // --- END Survey Results Processing ---

        // --- 6. Process Tags (Keep Existing Placeholder or Implement) ---
        processedData.processedTags = []; // Placeholder

        // --- 7. Construct Events Array (Keep Existing) ---
        processedData.Events = EVENT_TYPES.map(eventType => {
           // ... existing event construction logic ...
            const bookingValue = processedData[eventType.bookingField];
            const statusValue = processedData[eventType.statusField] || 'TBD'; // Default to TBD
            return {
                id: `${eventType.type}-${processedData.ID}`, // Create a unique ID
                type: eventType.type,
                date: bookingValue || null, // Keep raw date string or null
                status: statusValue,
                possibleStatuses: eventType.possibleStatuses,
                // Add API field names for potential updates later
                apiBookingField: eventType.bookingField,
                apiStatusField: eventType.statusField 
            };
        });

        // --- Clean up raw fields --- 
        delete processedData.Notes; // Remove original Notes array
        delete processedData.Note_Attachments; // Remove original Attachments array

        console.log('DataProcessors: Finished processing project details: ', processedData.ID);
        return processedData;

    } catch (error) {
        console.error('DataProcessors: Error processing project details data:', error, 'Raw Data:', projectResponse);
        return null; // Return null on error
    }
  }
  // processUsersData(usersResponse) { 
  //   // Use FIELD_USER_* constants here
  // }

};

// Expose the processors globally
export default DataProcessors; 