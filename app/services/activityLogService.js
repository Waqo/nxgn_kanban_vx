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
    let who = 'Unknown User'; // Default value

    if (currentUser?.name) {
        who = currentUser.name;
    } else {
        // If user name isn't available, try getting email from initParams
        console.log("ActivityLogService: User name not found, fetching email from initParams...");
        try {
            const params = await ZohoAPIService.getInitParams();
            if (params?.loginUser) {
                who = `Unknown (${params.loginUser})`;
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
            [FIELD_ACTIVITY_WHO]: who,
            [FIELD_ACTIVITY_WHERE]: ACTIVITY_SOURCE_PORTAL,
            [FIELD_ACTIVITY_PROJECT_LOOKUP]: projectId
        }
    };

    console.log(`ActivityLogService: Logging activity for project ${projectId}: "${activityText}" by ${who}`);

    try {
        // Fire and forget - no await here
        ZohoAPIService.addRecord(FORM_ACTIVITIES, payload);
        // No success log needed as it's background
    } catch (error) {
        // Log the error but don't disrupt the user flow
        console.error(`ActivityLogService: Failed to log activity for project ${projectId}. Error:`, error);
    }
} 