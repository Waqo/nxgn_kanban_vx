const { defineComponent, computed } = Vue; // Use global Vue
import { useNotificationsStore } from '../../store/notificationsStore.js';
const { useTimeAgo } = VueUse; // Use global VueUse

export default defineComponent({
    name: 'NotificationItem',
    props: {
        notification: {
            type: Object,
            required: true
        }
    },
    emits: ['item-click'],
    setup(props, { emit }) {
        const notificationsStore = useNotificationsStore();
        const notification = computed(() => props.notification);

        // Determine icon based on type
        const iconClass = computed(() => {
            switch (notification.value?.Notification_Type) {
                case 'Task Assignment': return 'fas fa-clipboard-list text-blue-500';
                case 'Note Mention': return 'far fa-comment-dots text-purple-500';
                case 'Issue Mention': return 'fas fa-exclamation-circle text-red-500';
                case 'Replied to Note': return 'fas fa-reply text-green-500';
                default: return 'far fa-bell text-gray-500';
            }
        });

        const message = computed(() => notification.value?.Message || 'No message content.');
        const timestampRef = computed(() => notification.value?.Added_Time);
        const timeAgo = useTimeAgo(timestampRef);

        const handleClick = () => {
            // Call store action to handle both marking read and navigation
            notificationsStore.handleNotificationClick(notification.value);
            emit('item-click', notification.value); // Also emit for dropdown closure
        };

        return {
            iconClass,
            message,
            timeAgo,
            handleClick
        };
    },
    template: `
        <a href="#" @click.prevent="handleClick" class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100" role="menuitem" tabindex="-1">
            <div class="flex items-start gap-3">
                <!-- Icon -->
                <div class="flex-shrink-0 pt-0.5">
                    <i :class="[iconClass, 'h-5 w-5']" aria-hidden="true"></i>
                </div>
                <!-- Content -->
                <div class="flex-1 min-w-0">
                    <p class="text-gray-800 leading-snug mb-0.5">{{ message }}</p>
                    <p class="text-xs text-gray-400">{{ timeAgo }}</p>
                </div>
            </div>
        </a>
    `
}); 