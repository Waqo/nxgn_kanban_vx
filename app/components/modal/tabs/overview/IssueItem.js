import BaseAvatar from '../../../common/BaseAvatar.js';
import { getInitials } from '../../../../utils/helpers.js';

const { computed, ref } = Vue;
const { useTimeAgo } = VueUse;

import { useUiStore } from '../../../../store/uiStore.js';
import { useProjectsStore } from '../../../../store/projectsStore.js';
import { useModalStore } from '../../../../store/modalStore.js';

export default {
  name: 'IssueItem',
  components: {
    BaseAvatar
  },
  props: {
    issue: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const uiStore = useUiStore();
    const issue = computed(() => props.issue);
    const projectsStore = useProjectsStore();
    const modalStore = useModalStore();

    const showAllTaggedUsers = ref(false);

    const authorName = computed(() => {
      // Prioritize User_Lookup if it exists and has a non-empty display value
      const userLookupName = issue.value.User_Lookup?.zc_display_value?.trim();
      if (userLookupName) {
        return userLookupName;
      }
      // Fallback to the Author field if User_Lookup is not usable
      const authorFieldName = issue.value.Author?.trim();
      if (authorFieldName) {
        return authorFieldName;
      }
      // Default if neither is available
      return 'Unknown User';
    });
    const authorInitials = computed(() => getInitials(authorName.value || 'U'));
    const timestampRef = computed(() => issue.value.Added_Time);
    const timeAgo = useTimeAgo(timestampRef);
    const issueContent = computed(() => issue.value.Issue || '');
    const isResolved = computed(() => issue.value.Is_Resolved === 'true');
    const showNotifySalesBadge = computed(() => issue.value.Notify_Sales === 'true');

    const taggedUsers = computed(() => {
      if (!Array.isArray(issue.value.Tagged_Users)) return [];
      return issue.value.Tagged_Users.map(user => user.zc_display_value?.trim() || 'Unknown User');
    });

    const TAGGED_USER_LIMIT = 3;
    const hasMoreTaggedUsers = computed(() => taggedUsers.value.length > TAGGED_USER_LIMIT);

    const displayedTaggedUsers = computed(() => {
      if (hasMoreTaggedUsers.value && !showAllTaggedUsers.value) {
        return taggedUsers.value.slice(0, TAGGED_USER_LIMIT);
      }
      return taggedUsers.value;
    });

    const remainingTaggedUsersCount = computed(() => {
        return taggedUsers.value.length - TAGGED_USER_LIMIT;
    });

    const resolveIssue = () => {
      const issueId = issue.value?.ID || issue.value?.id;
      if (!issueId) {
        uiStore.addNotification({ type: 'error', message: 'Cannot resolve issue: ID missing.', duration: 3000 });
        return;
      }
      projectsStore.resolveProjectIssue({ issueId })
        .then(() => modalStore.refreshModalData())
        .catch(error => console.error("IssueItem: Failed to resolve issue", error));
    };

    return {
      issue,
      authorInitials,
      authorName,
      timeAgo,
      timestampRef,
      issueContent,
      isResolved,
      showNotifySalesBadge,
      taggedUsers,
      resolveIssue,
      showAllTaggedUsers,
      displayedTaggedUsers,
      remainingTaggedUsersCount,
      hasMoreTaggedUsers
    };
  },
  template: `
    <div class="rounded-lg bg-red-50 border border-red-200 p-4 shadow-sm">
      <div class="flex items-start gap-3 mb-2">
        <base-avatar :initials="authorInitials" size="sm" variant="gray" />
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold text-sm text-gray-900 truncate" :title="authorName">{{ authorName }}</h3>
            <p class="text-xs text-gray-500" :title="timestampRef">{{ timeAgo }}</p>
          </div>
        </div>
      </div>

      <p class="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed mb-4">{{ issueContent }}</p>

      <div class="flex flex-wrap items-center gap-1 text-xs mb-2">
        <template v-if="taggedUsers.length > 0">
          <span v-for="(userName, index) in displayedTaggedUsers" :key="index" class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            @{{ userName }}
          </span>
          <button
            v-if="hasMoreTaggedUsers" 
            @click="showAllTaggedUsers = !showAllTaggedUsers" 
            class="ml-1 flex items-center justify-center h-5 w-5 bg-gray-200 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1"
            :title="showAllTaggedUsers ? 'Show fewer tagged users' : 'Show ' + remainingTaggedUsersCount + ' more tagged users'"
          >
            <template v-if="!showAllTaggedUsers">
              +{{ remainingTaggedUsersCount }}
            </template>
            <template v-else>
              <i class="fas fa-chevron-up text-xs"></i>
            </template>
          </button>
        </template>
        <span v-else class="italic text-gray-400">No tags.</span>
      </div>

      <div class="flex flex-wrap justify-between items-center gap-2">
        <div v-if="showNotifySalesBadge" class="inline-flex items-center gap-1 px-2 py-0.25 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
          <i class="fas fa-bullhorn text-xs"></i>
          <span>Sales Notified</span>
        </div>
        <div class="ml-auto">
          <div v-if="isResolved" class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <i class="fas fa-check-circle"></i>
            <span>Resolved</span>
          </div>
          <button
            v-else
            @click="resolveIssue"
            title="Mark Resolved"
            class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-400 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500"
          >
            <i class="fas fa-check text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  `
};
