import BaseAvatar from '../../../common/BaseAvatar.js';
import BaseBadge from '../../../common/BaseBadge.js';
import BaseButton from '../../../common/BaseButton.js'; // Needed for placeholder button
import { getInitials } from '../../../../utils/helpers.js';

// Import VueUse composable and Vue computed
const { computed } = Vue;
const { useTimeAgo } = VueUse; 

// --- ADD UI Store Import ---
import { useUiStore } from '../../../../store/uiStore.js';
// --- ADD Projects Store Import ---
import { useProjectsStore } from '../../../../store/projectsStore.js';
// --- ADD Modal Store Import ---
import { useModalStore } from '../../../../store/modalStore.js';

export default {
  name: 'IssueItem',
  components: {
    BaseAvatar,
    BaseBadge,
    BaseButton
  },
  props: {
    issue: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    // Get UI Store instance
    const uiStore = useUiStore();
    const issue = computed(() => props.issue);
    // --- ADD Projects Store Instance ---
    const projectsStore = useProjectsStore();
    // --- ADD Modal Store Instance ---
    const modalStore = useModalStore();

    // Author Name: Prioritize User_Lookup, fallback to Author
    const authorName = computed(() => issue.value.User_Lookup?.zc_display_value?.trim() || issue.value.author || 'Unknown User');
    const authorInitials = computed(() => getInitials(authorName.value || 'U')); // Use computed authorName
    
    const timestampRef = computed(() => issue.value.Added_Time);
    const timeAgo = useTimeAgo(timestampRef);
    
    const issueContent = computed(() => issue.value.Issue || ''); // Use direct field name
    const isResolved = computed(() => issue.value.Is_Resolved === 'true'); // Check for string 'true'
    
    // Notify Sales Badge
    const showNotifySalesBadge = computed(() => issue.value.Notify_Sales === 'true');

    // Tagged Users
    const taggedUsers = computed(() => {
        if (!Array.isArray(issue.value.Tagged_Users)) {
            return [];
        }
        return issue.value.Tagged_Users.map(user => user.zc_display_value?.trim() || 'Unknown User');
    });

    const resolveIssue = () => {
        // Replace alert with notification
        // uiStore.addNotification({ type: 'info', message: `Resolve Issue ${issue.value.id || issue.value.ID} functionality not implemented yet.` });
        const issueId = issue.value?.ID || issue.value?.id;
        if (!issueId) {
            uiStore.addNotification({ type: 'error', message: 'Cannot resolve issue: ID missing.', duration: 3000 });
            return;
        }
        
        // Call store action
        projectsStore.resolveProjectIssue({ issueId })
            .then(() => {
                // Success notification is handled in store
                // Refresh modal data to update the UI
                return modalStore.refreshModalData();
            })
            .catch(error => {
                // Error notification is handled in store
                console.error("IssueItem: Failed to resolve issue", error);
            });
    };

    return {
        issue,
        authorInitials,
        authorName,
        timeAgo,
        timestampRef,
        issueContent,
        isResolved,
        showNotifySalesBadge, // Expose new computed
        taggedUsers, // Expose new computed
        resolveIssue
    };
  },
  template: `
    <!-- Main container for the issue item -->
    <div class="issue-item space-y-2 bg-red-50 border border-red-200 rounded-lg p-3">
        <!-- Row 1: Avatar, Author, Time -->
        <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
                 <base-avatar :initials="authorInitials" size="sm" variant="gray"></base-avatar>
            </div>
            <div class="flex-1 flex items-center justify-between min-w-0">
                <h3 class="text-sm font-medium text-gray-900 truncate" :title="authorName">{{ authorName }}</h3>
                <p class="text-sm text-gray-500 flex-shrink-0 ml-2" :title="timestampRef">{{ timeAgo }}</p>
            </div>
        </div>

        <!-- Row 2: Divider -->
        <div class="border-t border-gray-200"></div>

        <!-- Row 3: Issue Content -->
        <div class="pt-1">
             <p class="text-sm text-gray-700 whitespace-pre-wrap break-words">{{ issueContent }}</p>
        </div>

        <!-- Row 4: Divider -->
        <div class="border-t border-gray-200"></div>

        <!-- Row 5: Tagged Users -->
        <div class="pt-1 flex items-center flex-wrap gap-1 text-xs">
            <!-- Tagged Users -->
            <template v-if="taggedUsers.length > 0">
                <!-- <span class="text-gray-500 flex-shrink-0"><i class="fas fa-users mr-1"></i></span> -->
                <span v-for="(userName, index) in taggedUsers" :key="index" class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">
                    @{{ userName }}
                </span>
            </template>
            <span v-if="taggedUsers.length === 0" class="text-gray-400 italic">
                No tags.
            </span>
        </div>

        <!-- Row 6: Divider (only show if there are tags) -->
        <div v-if="taggedUsers.length > 0" class="border-t border-gray-200"></div>

        <!-- Row 7: Actions (Mark Resolved Button / Resolved Badge) -->
        <div class="pt-1 flex justify-end">
            <base-badge v-if="isResolved" color="green">Resolved</base-badge> 
            <base-button 
                v-if="!isResolved" 
                @click="resolveIssue" 
                size="xs" 
                variant="secondary-light"
                leading-icon="fas fa-check"
                title="Mark Resolved" 
            >
                <span class="hidden md:inline">Mark Resolved</span>
            </base-button>
        </div>

        <!-- Row 8: Divider (only show if sales badge will be shown below) -->
        <div v-if="showNotifySalesBadge" class="border-t border-gray-200"></div>

        <!-- Row 9: Sales Notified Badge -->
        <div v-if="showNotifySalesBadge" class="pt-1">
            <base-badge color="purple" size="sm" class="inline-flex items-center">
                <i class="fas fa-bullhorn mr-1"></i> Sales Notified
            </base-badge>
        </div>
    </div>
  `
}; 