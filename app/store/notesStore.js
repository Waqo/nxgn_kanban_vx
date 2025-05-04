const { defineStore } = Pinia;
import ZohoAPIService from '../services/zohoCreatorAPI.js';
import { useUiStore } from './uiStore.js';
import { useModalStore } from './modalStore.js';
import { logActivity } from '../services/activityLogService.js';
import { logErrorToZoho } from '../services/errorLogService.js';
import {
    FORM_NOTES,
    FIELD_NOTE_CONTENT,
    FIELD_NOTE_PROJECT_LOOKUP,
    FIELD_NOTE_USER_LOOKUP,
    FIELD_NOTE_AUTHOR_TEXT,
    FIELD_NOTE_TEAM_ONLY,
    FIELD_NOTE_CONTEXT,
    FIELD_NOTE_DEPARTMENT,
    FIELD_NOTE_REPLIED_TO,
    FIELD_NOTE_TAGGED_USERS,
    FORM_NOTE_ATTACHMENTS,
    REPORT_NOTE_ATTACHMENTS,
    FIELD_NOTE_ATTACHMENT_NOTE_LOOKUP,
    FIELD_NOTE_ATTACHMENT_NAME,
    FIELD_NOTE_ATTACHMENT_FIELD,
    FIELD_NOTE_ATTACHMENT_TRANSFER_TRIGGER,
    FIELD_NOTE_ATTACHMENT_PROJECT_LOOKUP,
    FIELD_NOTE_ATTACHMENT_USER_LOOKUP
} from '../config/constants.js';

export const useNotesStore = defineStore('notes', {
    state: () => ({
        isLoading: false,
        error: null,
    }),
    actions: {
        /**
         * Adds a new note or reply to Zoho Creator.
         * Handles basic note fields initially. Attachments and tagging to be added later.
         *
         * @param {object} params - The parameters for the new note.
         * @param {string} params.projectId - ID of the related project.
         * @param {string} params.noteContent - The text content of the note.
         * @param {string} params.userId - ID of the user creating the note (for User_Lookup).
         * @param {string} params.userName - Name of the user creating the note (for Author text field).
         * @param {boolean} params.teamOnly - Whether the note is team-only.
         * @param {string} [params.context='General'] - The context of the note (e.g., 'General', 'Commissions').
         * @param {string} [params.parentNoteId=null] - Optional ID of the note being replied to.
         * @param {string} [params.parentNoteAuthor=null] - Optional name of the parent note's author.
         * @param {Array<File>} [params.attachments=[]] - Optional array of File objects to attach.
         * @param {Array<string>} [params.taggedUserIds=[]] - Optional array of user IDs to tag.
         * @returns {Promise<boolean>} - True if successful, false otherwise.
         */
        async addNewNote({ projectId, noteContent, userId, userName, teamOnly, context = 'General', parentNoteId = null, parentNoteAuthor = null, attachments = [], taggedUserIds = [] }) {
            const uiStore = useUiStore();
            const modalStore = useModalStore();

            // Basic Validation
            const hasContent = !!noteContent?.trim();
            const hasAttachments = attachments.length > 0;
            if (!projectId || (!hasContent && !hasAttachments) || !userId || !userName || !Array.isArray(taggedUserIds)) {
                console.error('Missing required fields for adding note', { projectId, noteContent, userId, userName });
                uiStore.addNotification({
                    type: 'error',
                    title: 'Missing Information',
                    message: 'Cannot add note: Project, User, and either content or attachments are required.'
                });
                return false;
            }

            this.isLoading = true;
            this.error = null;
            const operationType = parentNoteId ? 'reply' : 'note';
            const loadingToastId = `${operationType}-loading-${Date.now()}`;
            console.log(`[notesStore] Starting ${operationType} creation for project ${projectId}. Has Attachments: ${hasAttachments}`);
            uiStore.addNotification({
                id: loadingToastId,
                type: 'info',
                message: `Adding ${operationType}${hasAttachments ? ' with attachments...' : '...'}`,
                duration: 0 // Persistent
            });

            let newNoteId = null;
            let attachmentsAddedCount = 0;
            let attachmentErrors = [];

            try {
                const payload = {
                    data: {
                        [FIELD_NOTE_CONTENT]: hasContent ? noteContent.trim() : (hasAttachments ? '[Attachment(s) only]' : ' '),
                        [FIELD_NOTE_PROJECT_LOOKUP]: projectId,
                        [FIELD_NOTE_USER_LOOKUP]: userId,
                        [FIELD_NOTE_AUTHOR_TEXT]: userName, // Set Author text field
                        [FIELD_NOTE_TEAM_ONLY]: teamOnly ? 'true' : 'false',
                        [FIELD_NOTE_CONTEXT]: context || 'General', // Use passed context, fallback to General
                        [FIELD_NOTE_DEPARTMENT]: 'Project Management', // Default department
                        [FIELD_NOTE_TAGGED_USERS]: taggedUserIds
                    }
                };

                if (parentNoteId) {
                    payload.data[FIELD_NOTE_REPLIED_TO] = parentNoteId;
                }

                console.log('Adding Note/Reply with payload:', payload);

                console.log(`[notesStore] Calling API 1: addRecord for ${FORM_NOTES}`);
                const noteResponse = await ZohoAPIService.addRecord(FORM_NOTES, payload);
                console.log(`[notesStore] API 1 Response (addRecord ${FORM_NOTES}):`, noteResponse);

                if (noteResponse.code !== 3000 || !noteResponse.data?.ID) {
                    console.error(`[notesStore] Failed to add ${operationType} record:`, noteResponse);
                    throw new Error(noteResponse.message || 'Failed to create note record.');
                }

                newNoteId = noteResponse.data.ID;
                console.log(`[notesStore] ${operationType} record created successfully: ID ${newNoteId}`);

                // --- BEGIN Optimistic Update --- 
                /*
                try {
                    const now = new Date();
                    const processedNote = {
                        // Mimic structure from DataProcessors.js
                        id: newNoteId,
                        ID: newNoteId, // Include original ID field too if needed
                        content: hasContent ? noteContent.trim() : (hasAttachments ? '[Attachment(s) only]' : ' '),
                        Note: hasContent ? noteContent.trim() : (hasAttachments ? '[Attachment(s) only]' : ' '), // Match potential field name
                        author: userName,
                        Author: userName, // Match potential field name
                        addedTime: now.toISOString(), // Use current time as approximation
                        Added_Time: now.toISOString(),
                        department: 'Project Management', // Match default
                        Department: 'Project Management',
                        context: context || 'General',
                        Context: context || 'General',
                        teamOnly: teamOnly,
                        Team_Only: teamOnly ? 'true' : 'false',
                        repliedTo: parentNoteId,
                        Replied_To: parentNoteId ? { ID: parentNoteId } : null, // Structure might differ
                        taggedUsers: taggedUserIds.map(id => ({ ID: id })), // Assuming array of objects needed
                        Tagged_Users: taggedUserIds.map(id => ({ ID: id })), 
                        attachments: [], // Start with empty, attachments added later if needed
                        replies: [],
                        isReply: !!parentNoteId,
                        User_Lookup: { ID: userId, zc_display_value: userName } // Approximate lookup object
                    };

                    console.log("[notesStore] Optimistically adding processed note:", processedNote);
                    
                    if (modalStore.currentProjectDetails) {
                        let targetArray = null;
                        switch (processedNote.context) {
                            case 'General':     targetArray = modalStore.currentProjectDetails.General_Notes; break;
                            case 'Commissions': targetArray = modalStore.currentProjectDetails.Commission_Notes; break;
                            case 'Investor':    targetArray = modalStore.currentProjectDetails.Investor_Notes; break;
                            default:            targetArray = modalStore.currentProjectDetails.Other_Notes; break;
                        }
                        
                        if (targetArray && Array.isArray(targetArray)) {
                            targetArray.unshift(processedNote); // Add to beginning
                            console.log(`[notesStore] Note optimistically added to ${processedNote.context}_Notes.`);
                        } else {
                            console.warn(`[notesStore] Could not find or push to target array for context: ${processedNote.context}`);
                        }
                    } else {
                        console.warn("[notesStore] Cannot optimistically update: modalStore.currentProjectDetails is null.");
                    }
                } catch (optimisticError) {
                     console.error("[notesStore] Error during optimistic note update:", optimisticError);
                     // Don't stop the process, just log the error
                }
                */
                // --- END Optimistic Update --- 

                if (hasAttachments) {
                    console.log(`[notesStore] Entering attachment loop for ${attachments.length} files.`);
                    for (const file of attachments) {
                        console.log(`[notesStore] --- Processing attachment: ${file.name} (Size: ${file.size}) ---`);
                        try {
                            const attachmentPayload = {
                                data: {
                                    [FIELD_NOTE_ATTACHMENT_NOTE_LOOKUP]: newNoteId,
                                    [FIELD_NOTE_ATTACHMENT_NAME]: file.name,
                                    [FIELD_NOTE_ATTACHMENT_PROJECT_LOOKUP]: projectId,
                                    [FIELD_NOTE_ATTACHMENT_USER_LOOKUP]: userId
                                }
                            };
                            console.log(`[notesStore] Attachment Payload for ${file.name}:`, attachmentPayload);

                            console.log(`[notesStore] Calling API 2: addRecord for ${FORM_NOTE_ATTACHMENTS}`);
                            const attachRecordResponse = await ZohoAPIService.addRecord(FORM_NOTE_ATTACHMENTS, attachmentPayload);
                            console.log(`[notesStore] API 2 Response (addRecord ${FORM_NOTE_ATTACHMENTS} for ${file.name}):`, attachRecordResponse);

                            if (attachRecordResponse.code !== 3000 || !attachRecordResponse.data?.ID) {
                                console.error(`[notesStore] Failed to create attachment record for ${file.name}:`, attachRecordResponse);
                                throw new Error(`Failed to create record for ${file.name}.`);
                            }

                            const newAttachmentId = attachRecordResponse.data.ID;
                            console.log(`[notesStore] Attachment record created for ${file.name}: ID ${newAttachmentId}`);

                            console.log(`[notesStore] Calling API 3: uploadFile for attachment ${newAttachmentId}`);
                            const uploadResponse = await ZohoAPIService.uploadFile(
                                REPORT_NOTE_ATTACHMENTS, 
                                newAttachmentId, 
                                FIELD_NOTE_ATTACHMENT_FIELD, 
                                file
                            );
                            console.log(`[notesStore] API 3 Response (uploadFile for ${file.name}): Successfully uploaded`, uploadResponse);
                            attachmentsAddedCount++;

                            console.log(`[notesStore] Calling API 4: updateRecordById for attachment ${newAttachmentId} (Transfer Trigger)`);
                            const triggerPayload = { data: { [FIELD_NOTE_ATTACHMENT_TRANSFER_TRIGGER]: 'true' } };
                            const triggerResponse = await ZohoAPIService.updateRecordById(
                                REPORT_NOTE_ATTACHMENTS,
                                newAttachmentId,
                                triggerPayload
                            );
                            console.log(`[notesStore] API 4 Response (updateRecordById trigger for ${file.name}):`, triggerResponse);

                            if (triggerResponse.code !== 3000) {
                                console.warn(`[notesStore] Failed to trigger transfer for ${file.name} (Attachment ID: ${newAttachmentId}):`, triggerResponse);
                            } else {
                                console.log(`[notesStore] Transfer triggered successfully for ${file.name}`);
                            }

                        } catch (uploadError) {
                            console.error(`[notesStore] Error processing attachment ${file.name}:`, uploadError);
                            attachmentErrors.push(`${file.name}: ${uploadError.message || 'Upload failed'}`);
                            logErrorToZoho(uploadError, {
                                operation: 'notesStore.uploadAttachment',
                                projectId: projectId,
                                userId: userId,
                                noteId: newNoteId,
                                filename: file.name,
                                details: 'API call failed during individual attachment upload.',
                                taggedUserIds: taggedUserIds
                            });
                        }
                    }
                }

                uiStore.removeNotification(loadingToastId);

                let successMessage = `${parentNoteId ? 'Reply' : 'Note'} added successfully`;
                if (hasAttachments) {
                    successMessage += ` with ${attachmentsAddedCount} of ${attachments.length} attachment(s).`;
                }
                uiStore.addNotification({
                    type: 'success',
                    message: successMessage
                });

                if (attachmentErrors.length > 0) {
                    uiStore.addNotification({
                        type: 'warning',
                        title: `Attachment Upload Issue${attachmentErrors.length > 1 ? 's' : ''}`,
                        message: `Could not upload ${attachmentErrors.length} file(s):\n- ${attachmentErrors.join('\n- ')}`,
                        duration: 10000
                    });
                }

                // Construct improved log message
                let logMessage = 'Added note'; // Default
                if (parentNoteId && parentNoteAuthor) {
                    logMessage = `Replied to ${parentNoteAuthor}'s note`;
                } else if (parentNoteId) { // Fallback if author wasn't passed for some reason
                    logMessage = `Replied to note (ID: ${parentNoteId})`;
                }
                // --- End log message construction ---

                const logDetails = hasContent ? noteContent.trim().substring(0, 100) + '...' : '';
                const attachmentLog = hasAttachments ? ` (${attachmentsAddedCount}/${attachments.length} attachments)` : '';
                logActivity(projectId, `${logMessage}${attachmentLog}`, logDetails);

                // --- Refresh AFTER optimistic update --- 
                console.log("[notesStore] Triggering modal data refresh AFTER optimistic update.");
                await modalStore.refreshModalData();

                // Introduce a delay ONLY if attachments were processed, to allow Zoho backend time
                if (hasAttachments) {
                    console.log(`[notesStore] Waiting briefly for attachment processing before final refresh...`);
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
                    await modalStore.refreshModalData(); // Refresh again after delay
                    console.log(`[notesStore] Refreshed modal data after attachment delay.`);
                }

                console.log(`[notesStore] Finished ${operationType} creation. Success: true`); // LOG FINAL Success
                return true; // Indicate overall success (note created, maybe some attachments failed)
            } catch (error) { // Catch errors from creating the main note OR fatal errors during attachment loop setup
                console.error(`Error adding ${operationType}:`, error);
                this.error = error.message || 'An unknown error occurred.';
                console.log(`[notesStore] Finished ${operationType} creation. Success: false`);
                logErrorToZoho(error, {
                    operation: 'notesStore.addNewNote',
                    projectId: projectId,
                    userId: userId,
                    parentNoteId: parentNoteId,
                    hasAttachments: hasAttachments,
                    taggedUserIds: taggedUserIds,
                    details: `API call failed during ${operationType} creation (potentially before/during attachment loop). Note ID if created: ${newNoteId}`
                });
                uiStore.removeNotification(loadingToastId);
                uiStore.addNotification({
                    type: 'error',
                    title: 'Error',
                    message: `Failed to add ${operationType}: ${this.error}`
                });
                return false;
            } finally {
                this.isLoading = false;
            }
        }
    },
}); 