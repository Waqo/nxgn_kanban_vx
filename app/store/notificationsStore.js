const { defineStore } = Pinia; // Use global Pinia object
import ZohoAPIService from '../services/zohoCreatorAPI.js';
import { useUserStore } from './userStore.js';
import { useModalStore } from './modalStore.js'; // Needed for navigation
import { logErrorToZoho } from '../services/errorLogService.js';
import { useUiStore } from './uiStore.js';
import {
    REPORT_NOTIFICATIONS,
    FIELD_NOTIFICATION_USER_LOOKUP,
    FIELD_NOTIFICATION_IS_READ,
    FIELD_NOTIFICATION_PROJECT_LOOKUP,
    FIELD_NOTIFICATION_NOTE_LOOKUP,
    FIELD_NOTIFICATION_ISSUE_LOOKUP,
    FIELD_NOTIFICATION_TASK_LOOKUP
} from '../config/constants.js';

const POLLING_INTERVAL_MS = 60 * 1000; // CHANGE: 60 seconds

export const useNotificationsStore = defineStore('notifications', {
    state: () => ({
        notifications: [], // Holds currently fetched *unread* notifications
        isLoading: false,
        error: null,
        pollingIntervalId: null,
        lastFetchedTimestamp: null,
        processedNotificationIds: new Set(),
        initialFetchComplete: false // Flag for initial fetch
    }),
    getters: {
        unreadCount: (state) => state.notifications.length,
        unreadNotifications: (state) => state.notifications, // Simple getter
    },
    actions: {
        async fetchNotifications(isPolling = false) {
            if (this.isLoading) {
              // console.log('[NotificationsStore] Skipping fetch, already in progress.');
                return;
            }
            this.isLoading = true;
            this.error = null;
          // console.log(`[NotificationsStore] Fetching unread notifications... (Polling: ${isPolling})`);

            const userStore = useUserStore();
            const currentUserId = userStore.currentUser?.id;

            if (!currentUserId) {
                console.warn('[NotificationsStore] Cannot fetch notifications: User ID not available.');
                this.error = 'User not logged in.';
                this.isLoading = false;
                return;
            }

            // --- Use centrally managed stores/hooks ---
            const uiStore = useUiStore();
            // --- End Instantiation ---

            try {
                const criteria = `(${FIELD_NOTIFICATION_USER_LOOKUP} == ${currentUserId} && ${FIELD_NOTIFICATION_IS_READ} == false)`;

                // --- Step 1: Get Record Count --- 
              // console.log(`[NotificationsStore] Getting unread count for criteria: ${criteria}`);
                const countResponse = await ZohoAPIService.getRecordCount(REPORT_NOTIFICATIONS, criteria);
                
                // Check for success code and result structure
                if (countResponse.code !== 3000 || !countResponse.result || typeof countResponse.result.records_count === 'undefined') {
                    throw new Error(countResponse.message || `API Error fetching count: Code ${countResponse.code}`);
                }
                
                const unreadCount = parseInt(countResponse.result.records_count, 10);
              // console.log(`[NotificationsStore] Unread count from API: ${unreadCount}`);

                // --- Step 2: Fetch Records ONLY if count > 0 ---
                let fetchedNotifications = [];
                if (unreadCount > 0) {
                  // console.log(`[NotificationsStore] Count > 0, fetching records...`);
                    const response = await ZohoAPIService.getRecords(REPORT_NOTIFICATIONS, criteria, 200);
                    
                    if (response.code === 3000) {
                        fetchedNotifications = response.data || [];
                    } else if (response.code === 9280) { // Should not happen if count > 0, but handle defensively
                        console.warn(`[NotificationsStore] getRecords returned 9280 (No Records) despite count being ${unreadCount}. Setting to empty.`);
                        fetchedNotifications = []; 
                    } else {
                        throw new Error(response.message || `API Error Code ${response.code}`);
                    }
                } else {
                  // console.log(`[NotificationsStore] Count is 0, skipping getRecords call.`);
                    // Ensure notifications are cleared if count is zero
                    fetchedNotifications = []; 
                }
                // --- End Fetching Logic ---
                
                // --- Logic to find NEW notifications and trigger alerts/browser notifications ---
                // Check if this is the initial fetch or a subsequent poll
                if (!this.initialFetchComplete) {
                    // First fetch: Just populate processed IDs, don't trigger alerts
                  // console.log('[NotificationsStore] Initial fetch: Populating processed IDs without alerts.');
                    fetchedNotifications.forEach(notification => {
                        this.processedNotificationIds.add(notification.ID);
                    });
                    this.initialFetchComplete = true; // Mark initial fetch complete
                } else {
                    // Subsequent fetch: Find truly new notifications and trigger alerts
                    const newNotifications = [];
                    fetchedNotifications.forEach(notification => {
                        if (!this.processedNotificationIds.has(notification.ID)) {
                            newNotifications.push(notification);
                            this.processedNotificationIds.add(notification.ID); // Add new ID
                        }
                    });
                    
                    if (newNotifications.length > 0) {
                      // console.log(`[NotificationsStore] Found ${newNotifications.length} new unread notifications on poll.`);
                        newNotifications.forEach(newNotif => {
                            // 1. Trigger In-App Alert via uiStore
                            uiStore.addNewNotificationAlert({
                                // id: newNotif.ID, // uiStore generates ID
                                type: newNotif.Notification_Type || 'default',
                                message: newNotif.Message || 'New notification received.'
                            });
                        });
                    } 
                }
                // --- End initial fetch vs. poll logic ---
                
                // Update the main notifications list (for dropdown)
                this.notifications = fetchedNotifications;
                this.lastFetchedTimestamp = Date.now();
              // console.log(`[NotificationsStore] Fetched ${this.notifications.length} total unread notifications.`);

            } catch (fetchError) {
                console.error('[NotificationsStore] Error fetching notifications:', fetchError);
                this.error = fetchError.message || 'Failed to fetch notifications.';
                logErrorToZoho(fetchError, {
                    operation: 'fetchNotifications',
                    userId: currentUserId,
                    details: 'Failed to fetch unread notifications.',
                    widgetName: "Kanban Widget"
                });
            } finally {
                this.isLoading = false;
            }
        },

        async markAsRead(notificationId) {
            if (!notificationId) return;
          // console.log(`[NotificationsStore] Marking notification ${notificationId} as read...`);

            const notificationIndex = this.notifications.findIndex(n => n.ID === notificationId);
            let removedNotification = null;
            if (notificationIndex > -1) {
                removedNotification = this.notifications.splice(notificationIndex, 1)[0];
            }

            try {
                const payload = { data: { [FIELD_NOTIFICATION_IS_READ]: 'true' } };
                await ZohoAPIService.updateRecordById(REPORT_NOTIFICATIONS, notificationId, payload);
              // console.log(`[NotificationsStore] Successfully marked ${notificationId} as read via API.`);
            } catch (updateError) {
                console.error(`[NotificationsStore] Error marking notification ${notificationId} as read:`, updateError);
                logErrorToZoho(updateError, {
                    operation: 'markAsRead',
                    notificationId: notificationId,
                    details: 'API call failed to mark notification as read.',
                    widgetName: "Kanban Widget"
                });
                if (removedNotification) {
                    this.notifications.splice(notificationIndex, 0, removedNotification);
                }
                throw updateError;
            }
        },

        async markAllAsRead() {
            const notificationsToMark = [...this.notifications];
            if (notificationsToMark.length === 0) return;
            
            const userStore = useUserStore();
            const currentUserId = userStore.currentUser?.id;
            if (!currentUserId) {
                console.error("[NotificationsStore] Cannot mark all as read: User ID not available.");
                return;
            }

          // console.log(`[NotificationsStore] Attempting to mark all ${notificationsToMark.length} notifications as read via bulk update...`);

            // --- Prepare for UI update immediately --- 
            this.notifications = []; // Optimistically clear the list

            // --- Prepare bulk update --- 
            const criteria = `(${FIELD_NOTIFICATION_USER_LOOKUP} == ${currentUserId} && ${FIELD_NOTIFICATION_IS_READ} == false)`;
            const updatePayload = { [FIELD_NOTIFICATION_IS_READ]: 'true' }; // Data part of the payload

            try {
                // --- Call Bulk Update API --- 
                await ZohoAPIService.updateRecords(REPORT_NOTIFICATIONS, criteria, updatePayload);
              // console.log('[NotificationsStore] Successfully initiated bulk mark all as read via API.');
                 // No need to loop or handle individual results unless specific error handling is required

            } catch (bulkUpdateError) {
                console.error(`[NotificationsStore] Error marking all notifications as read via bulk update:`, bulkUpdateError);
                logErrorToZoho(bulkUpdateError, {
                    operation: 'markAllAsRead (bulk)',
                    userId: currentUserId,
                    criteria: criteria,
                    details: 'API call failed to bulk update notifications as read.',
                    widgetName: "Kanban Widget"
                });
                
                // --- Rollback UI on error --- 
                // Re-fetch to get the accurate state since bulk update failed
                console.warn('[NotificationsStore] Bulk update failed. Re-fetching notifications to correct UI.');
                await this.fetchNotifications(); 
                // Optionally add a UI notification about the failure
                const uiStore = useUiStore();
                uiStore.addNotification({ type: 'error', message: 'Failed to mark all notifications as read.', duration: 4000 });
            }
            
            // --- Remove Old Loop Logic ---
            // const promises = notificationsToMark.map(n => this.markAsRead(n.ID).catch(e => ({ id: n.ID, error: e })));
            // const results = await Promise.allSettled(promises);
            // 
            // const failedUpdates = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.error));
            // if (failedUpdates.length > 0) {
            //     console.error(`[NotificationsStore] Failed to mark ${failedUpdates.length} notifications as read. Re-fetching.`);
            //     await this.fetchNotifications();
            // } else {
            //     console.log('[NotificationsStore] Successfully marked all as read.');
            // }
            // --- End Remove ---
        },

        async handleNotificationClick(notification) {
            if (!notification?.ID) return;

            const projectId = notification[FIELD_NOTIFICATION_PROJECT_LOOKUP]?.ID;
            const noteId = notification[FIELD_NOTIFICATION_NOTE_LOOKUP]?.ID;
            const issueId = notification[FIELD_NOTIFICATION_ISSUE_LOOKUP]?.ID;
            const taskId = notification[FIELD_NOTIFICATION_TASK_LOOKUP]?.ID;

            try {
                await this.markAsRead(notification.ID);
            } catch (error) {
                console.error("Failed to mark notification as read before navigation.");
            }

            if (projectId) {
                const modalStore = useModalStore();
                await modalStore.openModal(projectId);

                let targetTab = 'overview';
                if (taskId) targetTab = 'tasks';
                else if (noteId) targetTab = 'overview';
                else if (issueId) targetTab = 'overview';

                modalStore.setActiveTab(targetTab);

              // console.log(`[NotificationsStore] Navigated to Project ${projectId}, Tab: ${targetTab}. Target Item ID: ${noteId || issueId || taskId || 'N/A'}`);
            } else {
                console.warn('[NotificationsStore] Cannot navigate: Project ID missing from notification.', notification);
            }
        },

        startPolling() {
            if (this.pollingIntervalId) {
              // console.log('[NotificationsStore] Polling already active.');
                return;
            }
          // console.log(`[NotificationsStore] Starting notification polling every ${POLLING_INTERVAL_MS / 1000} seconds.`);
            this.initialFetchComplete = false; // Reset flag on start
            this.fetchNotifications();
            this.pollingIntervalId = setInterval(() => {
                this.fetchNotifications(true);
            }, POLLING_INTERVAL_MS);
        },

        stopPolling() {
            if (this.pollingIntervalId) {
              // console.log('[NotificationsStore] Stopping notification polling.');
                clearInterval(this.pollingIntervalId);
                this.pollingIntervalId = null;
            }
        },
    },
}); 