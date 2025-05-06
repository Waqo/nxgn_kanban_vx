const { defineComponent, computed, onMounted, onUnmounted } = Vue;
import { useNotificationsStore } from '../../store/notificationsStore.js';
import NotificationItem from './NotificationItem.js';
import BaseButton from '../common/BaseButton.js';

export default defineComponent({
    name: 'NotificationDropdown',
    components: {
        NotificationItem,
        BaseButton
    },
    emits: ['close'],
    setup(props, { emit }) {
        const notificationsStore = useNotificationsStore();

        const notifications = computed(() => notificationsStore.unreadNotifications);
        const isLoading = computed(() => notificationsStore.isLoading);
        const error = computed(() => notificationsStore.error);
        const hasNotifications = computed(() => notifications.value.length > 0);

        const markAllRead = () => {
            notificationsStore.markAllAsRead();
            // Optionally close dropdown after marking all as read
            // emit('close');
        };

        const handleItemClick = (notification) => {
            // Action is handled in store, just close dropdown
            emit('close');
        };

        // Close dropdown if clicking outside
        const handleClickOutside = (event) => {
            // Basic check, can be refined with refs
            if (!event.target.closest('.notification-dropdown-panel')) {
                emit('close');
            }
        };

        onMounted(() => {
            document.addEventListener('mousedown', handleClickOutside);
        });

        onUnmounted(() => {
            document.removeEventListener('mousedown', handleClickOutside);
        });

        return {
            notifications,
            isLoading,
            error,
            hasNotifications,
            markAllRead,
            handleItemClick
        };
    },
    template: `
        <div class="notification-dropdown-panel w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
             <!-- Header -->
             <div class="flex justify-between items-center px-4 py-2 border-b border-gray-200">
                 <h3 class="text-sm font-medium text-gray-700">Notifications</h3>
                 <base-button
                     v-if="hasNotifications"
                     @click="markAllRead"
                     variant="link"
                     size="xs"
                     class="text-blue-600 hover:text-blue-800"
                 >
                     Mark all as read
                 </base-button>
             </div>

             <!-- Body -->
             <div class="max-h-96 overflow-y-auto">
                 <!-- Loading State -->
                 <div v-if="isLoading && !hasNotifications" class="p-4 text-center text-gray-500 text-sm">
                     Loading...
                 </div>
                 <!-- Error State -->
                 <div v-else-if="error" class="p-4 text-center text-red-600 text-sm">
                     Error: {{ error }}
                 </div>
                 <!-- Empty State -->
                 <div v-else-if="!hasNotifications" class="p-6 text-center text-gray-500 text-sm">
                     <i class="fas fa-check-circle text-green-500 text-2xl mb-2"></i><br>
                     You're all caught up!
                 </div>
                 <!-- Notification List -->
                 <ul v-else role="list" class="divide-y divide-gray-100">
                     <li v-for="notification in notifications" :key="notification.ID">
                         <notification-item
                            :notification="notification"
                            @item-click="handleItemClick(notification)"
                         />
                     </li>
                 </ul>
             </div>
             <!-- Footer (Optional) -->
             <!--
             <div class="px-4 py-2 border-t border-gray-200">
                 <a href="#" class="text-sm text-blue-600 hover:text-blue-800">View all notifications</a>
             </div>
             -->
        </div>
    `
}); 