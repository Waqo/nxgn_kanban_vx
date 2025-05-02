import ZohoAPIService from './zohoCreatorAPI.js';
import { useUserStore } from '../store/userStore.js';
import {
    FORM_ACTIVITIES,
    FIELD_ACTIVITY_DESCRIPTION,
    FIELD_ACTIVITY_WHO,
    FIELD_ACTIVITY_WHERE,
    FIELD_ACTIVITY_PROJECT_LOOKUP,
    ACTIVITY_SOURCE_PORTAL
} from '../config/constants.js';

/**
 * Logs an activity record in Zoho Creator.
 * This function runs in the background and swallows errors.
 * 
 * @param {string} projectId - The ID of the project record this activity relates to.
 * @param {string} activityText - The description of the activity.
 */
export async function logActivity(projectId, activityText) {
    if (!projectId || !activityText) {
        console.warn("ActivityLogService: Skipping log due to missing projectId or activityText.");
        return;
    }

    const userStore = useUserStore();
    const currentUser = userStore.currentUser;
    // Determine the value for the Is_Who text field
    let whoValue = 'Unknown User'; // Default

    if (currentUser?.name) {
        whoValue = currentUser.name; // Prioritize name
    } else {
        // Fallback to email if name is unavailable
        console.warn("ActivityLogService: User name not found, trying email fallback...");
        try {
            const params = await ZohoAPIService.getInitParams();
            if (params?.loginUser) {
                whoValue = `Unknown (${params.loginUser})`;
            } else {
                console.warn("ActivityLogService: Could not get loginUser email from initParams for unknown user log.");
            }
        } catch (error) {
            console.error("ActivityLogService: Error fetching initParams for unknown user log:", error);
            // Keep default 'Unknown User'
        }
    }

    const payload = {
        data: {
            [FIELD_ACTIVITY_DESCRIPTION]: activityText,
            [FIELD_ACTIVITY_WHO]: whoValue, // Send Name string (or fallback)
            [FIELD_ACTIVITY_WHERE]: ACTIVITY_SOURCE_PORTAL,
            [FIELD_ACTIVITY_PROJECT_LOOKUP]: projectId,
             // Optionally set the User lookup field if it exists and is needed
            // 'User': currentUser?.id // Uncomment if 'User' lookup should be set
        }
    };

    console.log(`ActivityLogService: Logging activity for project ${projectId}: "${activityText}" by ${whoValue}`);

    try {
        // Fire and forget - no await here
        ZohoAPIService.addRecord(FORM_ACTIVITIES, payload);
        // No success log needed as it's background
    } catch (error) {
        // Log the error but don't disrupt the user flow
        console.error(`ActivityLogService: Failed to log activity for project ${projectId}. Error:`, error);
    }
} 