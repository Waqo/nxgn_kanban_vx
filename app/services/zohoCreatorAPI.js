/**
 * Zoho Creator API Service
 *
 * Wraps ZOHO.CREATOR JS SDK calls for the Kanban Widget.
 * Handles data fetching, updates, creation, deletion, file operations, etc.
 * Assumes ZOHO SDK (widgetsdk-min.js) is loaded globally.
 */
const ZohoAPIService = {
  /**
   * Fetches initial parameters, including the logged-in user's email.
   * @returns {Promise<object>} Promise resolving with the init parameters object.
   */
  async getInitParams() {
    try {
      // console.log("ZohoAPIService: Fetching Init Params...");
      const response = await ZOHO.CREATOR.UTIL.getInitParams();
      // console.log("ZohoAPIService: Init Params Received:", response);
      // Directly return the response object which contains loginUser, appLinkName etc.
      return response;
    } catch (error) {
      console.error("ZohoAPIService: Error fetching init params:", error);
      throw error; // Re-throw the error to be handled by the caller
    }
  },

  /**
   * Fetches records from a specified report, with optional criteria and pagination.
   * @param {string} reportName - The link name of the report.
   * @param {string} [criteria] - Optional criteria string (Zoho API format).
   * @param {number} [maxRecords=1000] - Maximum records to fetch per call (200, 500, or 1000).
   * @param {string} [recordCursor] - Optional cursor for fetching subsequent pages.
   * @param {string} [appName] - Optional app link name if fetching from another app.
   * @returns {Promise<object>} Promise resolving with the API response (containing data array and potentially more_records cursor).
   */
  async getRecords(reportName, criteria, maxRecords = 1000, recordCursor, appName) {
    if (!reportName) {
      throw new Error("ZohoAPIService: reportName is required for getRecords.");
    }

    const config = {
      report_name: reportName,
      max_records: maxRecords,
    };

    if (criteria) config.criteria = criteria;
    if (recordCursor) config.record_cursor = recordCursor;
    if (appName) config.app_name = appName;

    try {
      // console.log(`ZohoAPIService: Fetching records for report: ${reportName}`, config);
      const response = await ZOHO.CREATOR.DATA.getRecords(config);
      // console.log(`ZohoAPIService: Records received for ${reportName}:`, response);

      if (response.code !== 3000) {
        // Handle potential API errors indicated by non-3000 codes
        console.error(`ZohoAPIService: API Error fetching records for ${reportName}:`, response);
        throw new Error(response.message || `API Error Code ${response.code}`);
      }
      // Success: response structure is { code: 3000, data: [...], more_records?: "cursor_string" }
      return response;
    } catch (error) {
      console.error(`ZohoAPIService: Error in getRecords for ${reportName}:`, error);
      throw error;
    }
  },

  /**
   * Fetches a single record by its ID from a specified report.
   * @param {string} reportName - The link name of the report.
   * @param {string} recordId - The ID of the record to fetch.
   * @param {string} [appName] - Optional app link name if fetching from another app.
   * @returns {Promise<object>} Promise resolving with the record data object.
   */
  async getRecordById(reportName, recordId, appName) {
    if (!reportName || !recordId) {
      throw new Error("ZohoAPIService: reportName and recordId are required for getRecordById.");
    }

    const config = {
      report_name: reportName,
      field_config: "detail_view",
      id: recordId,
    };
    if (appName) config.app_name = appName;

    try {
      // console.log(`ZohoAPIService: Fetching record by ID: ${recordId} from report: ${reportName}`, config);
      const response = await ZOHO.CREATOR.DATA.getRecordById(config);
      // console.log(`ZohoAPIService: Record received for ID ${recordId}:`, response);

      if (response.code !== 3000) {
          console.error(`ZohoAPIService: API Error fetching record ${recordId}:`, response);
          throw new Error(response.message || `API Error Code ${response.code}`);
      }
      // Success: response structure is { code: 3000, data: {...} }
      return response.data; // Return only the data part
    } catch (error) {
      console.error(`ZohoAPIService: Error in getRecordById for ${recordId}:`, error);
      throw error;
    }
  },

  /**
   * Updates a single record by its ID in a specified report.
   * @param {string} reportName - The link name of the report containing the record.
   * @param {string} recordId - The ID of the record to update.
   * @param {object} updateData - The object containing field link names and new values (e.g., { data: { Field_Name: 'New Value' } }).
   * @param {string} [appName] - Optional app link name if updating in another app.
   * @returns {Promise<object>} Promise resolving with the API response (containing ID of updated record).
   */
  async updateRecordById(reportName, recordId, updateData, appName) {
      if (!reportName || !recordId || !updateData) {
          throw new Error("ZohoAPIService: reportName, recordId, and updateData are required for updateRecordById.");
      }

      const config = {
          report_name: reportName,
          id: recordId,
          payload: updateData // updateData should be in the { data: { ... } } format
      };
      if (appName) config.app_name = appName;

      try {
          // console.log(`ZohoAPIService: Updating record ID: ${recordId} in report: ${reportName}`, config);
          const response = await ZOHO.CREATOR.DATA.updateRecordById(config);
          // console.log(`ZohoAPIService: Record update response for ID ${recordId}:`, response);

          if (response.code !== 3000) {
              console.error(`ZohoAPIService: API Error updating record ${recordId}:`, response);
              throw new Error(response.message || `API Error Code ${response.code}`);
          }
          // Success: response structure is { code: 3000, data: { ID: "..." }, message: "success" }
          return response; // Return the full response for now
      } catch (error) {
          console.error(`ZohoAPIService: Error in updateRecordById for ${recordId}:`, error);
          throw error;
      }
  },

  /**
   * Adds a new record to a specified form.
   * @param {string} formName - The link name of the form.
   * @param {object} payload - The data payload for the new record (e.g., { data: { Field_Name: 'Value' } }).
   * @param {string} [appName] - Optional app link name.
   * @returns {Promise<object>} Promise resolving with the API response (containing ID of new record).
   */
  async addRecord(formName, payload, appName) {
      if (!formName || !payload) {
          throw new Error("ZohoAPIService: formName and payload are required for addRecord.");
      }

      const config = {
          form_name: formName,
          payload: payload // payload should be in the { data: { ... } } format
      };
      if (appName) config.app_name = appName;

      try {
          // console.log(`ZohoAPIService: Adding record to form: ${formName}`, config);
          const response = await ZOHO.CREATOR.DATA.addRecords(config);
          // console.log(`ZohoAPIService: Record add response for form ${formName}:`, response);

          if (response.code !== 3000) {
              console.error(`ZohoAPIService: API Error adding record to ${formName}:`, response);
              throw new Error(response.message || `API Error Code ${response.code}`);
          }
          // Success: response structure is { code: 3000, data: { ID: "..." }, message: "success" }
          return response; // Return the full response 
      } catch (error) {
          console.error(`ZohoAPIService: Error in addRecord for ${formName}:`, error);
          throw error;
      }
  },

  /**
   * Deletes a record by its ID from a specified report.
   * @param {string} reportName - The link name of the report containing the record.
   * @param {string} recordId - The ID of the record to delete.
   * @param {string} [appName] - Optional app link name.
   * @returns {Promise<object>} Promise resolving with the API response.
   */
  async deleteRecordById(reportName, recordId, appName) {
      if (!reportName || !recordId) {
          throw new Error("ZohoAPIService: reportName and recordId are required for deleteRecordById.");
      }

      const config = {
          report_name: reportName,
          id: recordId
      };
      if (appName) config.app_name = appName;

      try {
          // console.log(`ZohoAPIService: Deleting record ID: ${recordId} from report: ${reportName}`, config);
          // Note: The SDK method is deleteRecordById, but the response structure in docs shows result as an array.
          const response = await ZOHO.CREATOR.DATA.deleteRecordById(config);
          // console.log(`ZohoAPIService: Record delete response for ID ${recordId}:`, response);

          // Check the nested result code if the outer code is 3000
          if (response.code === 3000 && response.result && response.result[0]?.code !== 3000) {
             const nestedResult = response.result[0];
             console.error(`ZohoAPIService: API Error deleting record ${recordId} (nested):`, nestedResult);
             throw new Error(nestedResult.message || `API Error Code ${nestedResult.code}`);
          } else if (response.code !== 3000) {
              console.error(`ZohoAPIService: API Error deleting record ${recordId}:`, response);
              throw new Error(response.message || `API Error Code ${response.code}`);
          }
          // Success: response structure is { code: 3000, result: [{ code: 3000, data: { ID: "..." }, message: "success" }] }
          return response; 
      } catch (error) {
          console.error(`ZohoAPIService: Error in deleteRecordById for ${recordId}:`, error);
          throw error;
      }
  },

  /**
   * Uploads a file to a file upload field in a specific record.
   * @param {string} reportName - The link name of the report containing the record.
   * @param {string} recordId - The ID of the record.
   * @param {string} fieldName - The link name of the file upload field.
   * @param {File} fileObject - The File object to upload (e.g., from an <input type="file">).
   * @param {string} [appName] - Optional app link name.
   * @returns {Promise<object>} Promise resolving with the API response (containing filename/path).
   */
  async uploadFile(reportName, recordId, fieldName, fileObject, appName) {
      if (!reportName || !recordId || !fieldName || !fileObject) {
          throw new Error("ZohoAPIService: reportName, recordId, fieldName, and fileObject are required for uploadFile.");
      }
      if (!(fileObject instanceof File)) {
          throw new Error("ZohoAPIService: fileObject must be an instance of File.");
      }

      const config = {
          report_name: reportName,
          id: recordId,
          field_name: fieldName,
          file: fileObject
      };
      if (appName) config.app_name = appName;

      try {
          // console.log(`ZohoAPIService: Uploading file to field ${fieldName} for record ${recordId} in report ${reportName}`, config);
          const response = await ZOHO.CREATOR.FILE.uploadFile(config);
          // console.log(`ZohoAPIService: File upload response for record ${recordId}:`, response);

          if (response.code !== 3000) {
              console.error(`ZohoAPIService: API Error uploading file for record ${recordId}:`, response);
              throw new Error(response.message || `API Error Code ${response.code}`);
          }
          // Success: response structure { code: 3000, data: { filename: "...", filepath: "...", message: "success" } }
          return response.data; // Return just the data part
      } catch (error) {
          console.error(`ZohoAPIService: Error in uploadFile for record ${recordId}:`, error);
          throw error;
      }
  },

  /**
   * Reads/downloads a file from a file upload field.
   * @param {string} reportName - The link name of the report containing the record.
   * @param {string} recordId - The ID of the record.
   * @param {string} fieldName - The link name of the file upload field.
   * @param {string} [appName] - Optional app link name.
   * @returns {Promise<Blob|ArrayBuffer|any>} Promise resolving with the raw file content (e.g., Blob).
   */
  async readFile(reportName, recordId, fieldName, appName) {
      if (!reportName || !recordId || !fieldName) {
          throw new Error("ZohoAPIService: reportName, recordId, and fieldName are required for readFile.");
      }

      const config = {
          report_name: reportName,
          id: recordId,
          field_name: fieldName
      };
      if (appName) config.app_name = appName;

      try {
          // console.log(`ZohoAPIService: Reading file from field ${fieldName} for record ${recordId} in report ${reportName}`, config);
          // The SDK directly returns the file data (e.g., Blob) on success
          const fileData = await ZOHO.CREATOR.FILE.readFile(config);
          // console.log(`ZohoAPIService: File read success for record ${recordId}, Field ${fieldName}. Type:`, typeof fileData);
          return fileData;
      } catch (error) {
          // Errors might not have a standard code/message structure like data APIs
          console.error(`ZohoAPIService: Error in readFile for record ${recordId}, Field ${fieldName}:`, error);
          // Attempt to create a more informative error
          const errorMessage = error?.message || (typeof error === 'string' ? error : 'Unknown error reading file');
          throw new Error(errorMessage);
      }
  },

  /**
   * Navigates the parent window based on the provided configuration.
   * Mimics ZOHO.CREATOR.UTIL.navigateParentURL functionality.
   * @param {object} config - Configuration object for navigation.
   * @param {string} config.action - Navigation action ('open', 'reload', 'back', 'close', 'close all').
   * @param {string} [config.url] - URL required if action is 'open'.
   * @param {string} [config.window='new'] - Target window ('new' or 'same') if action is 'open'. Defaults to 'new'.
   */
  navigateParentUrl(config) { // Changed parameter to accept config object
    // Basic validation
    if (!config || !config.action) {
        console.error("ZohoAPIService: Config object with 'action' key is required for navigateParentUrl.");
        return;
    }
    if (config.action === 'open' && !config.url) {
        console.error("ZohoAPIService: 'url' is required in config when action is 'open'.");
        return;
    }
    // Set default window target if opening and not provided
    if (config.action === 'open' && !config.window) {
        config.window = 'new';
    }

    // console.log(`ZohoAPIService: Navigating parent URL with config:`, config);
    try {
        // Check if the specific function exists
        if (typeof ZOHO.CREATOR.UTIL.navigateParentURL === 'function') 
        {
            ZOHO.CREATOR.UTIL.navigateParentURL(config); 
        } else {
            console.warn("ZOHO.CREATOR.UTIL.navigateParentURL function not found. Using fallback navigation.");
            // Attempt fallback based on action
            switch (config.action) {
                case 'open':
                    if (config.window === 'same') {
                        window.location.href = config.url;
                    } else {
                        window.open(config.url, '_blank');
                    }
                    break;
                case 'reload':
                    window.location.reload();
                    break;
                case 'back':
                    window.history.back();
                    break;
                // 'close' and 'close all' have no reliable standard browser fallback
                default:
                    console.error(`Fallback navigation not implemented for action: ${config.action}`);
                    alert(`Navigation action '${config.action}' could not be performed.`);
            }
        }
    } catch (error) {
        console.error("Error calling ZOHO.CREATOR.UTIL.navigateParentURL or accessing ZOHO objects:", error);
        // Attempt fallback on error
        try {
            switch (config.action) {
                case 'open':
                     if (config.window === 'same') {
                        window.location.href = config.url;
                    } else {
                        window.open(config.url, '_blank');
                    }
                    break;
                case 'reload':
                    window.location.reload();
                    break;
                 case 'back':
                    window.history.back();
                    break;
                default:
                    console.error(`Fallback navigation not implemented for action: ${config.action}`);
                    alert(`Could not perform navigation action '${config.action}'.`);
            }
        } catch (fallbackError) {
            console.error("Error attempting fallback navigation:", fallbackError);
             alert(`Could not perform navigation action '${config.action}'. Please check browser settings.`);
        }
    }
  },

  // async invokeCustomApi(functionName, data, appName) { ... } // Placeholder

};

// Expose the service globally for access in other scripts (due to no build step)
// window.ZohoAPIService = ZohoAPIService;
export default ZohoAPIService;
