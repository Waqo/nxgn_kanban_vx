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
    console.log('DataProcessors: Processing Stages Response:', stagesResponse);
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

      console.log('DataProcessors: Processed Stages:', processedStages);
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
    console.log(`DataProcessors: Processing ${rawProjectsData?.length || 0} raw project records.`);
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

      console.log(`DataProcessors: Finished processing ${processedProjects.length} projects.`);
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
    console.log('DataProcessors: Processing Sales Reps Response:', salesRepsResponse);
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
    console.log('DataProcessors: Processing Sales Orgs Response:', salesOrgsResponse);
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
    console.log('DataProcessors: Processing Tags Response:', tagsResponse);
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
        console.log('DataProcessors: Processed Tags Map:', tagsMap);
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
    console.log('DataProcessors: Processing Tranches Response:', tranchesResponse);
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

  // --- Placeholder for other processing functions ---
  // processProjectDetails(projectResponse) { ... }
  // processUsersData(usersResponse) { 
  //   // Use FIELD_USER_* constants here
  // }

};

// Expose the processors globally
export default DataProcessors; 