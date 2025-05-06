const { defineComponent, computed, ref } = Vue; // Use global Vue
import { useNotificationsStore } from '../../store/notificationsStore.js';
import BaseBadge from '../common/BaseBadge.js'; // Assuming BaseBadge is global or imported correctly
import NotificationDropdown from './NotificationDropdown.js'; // Import the dropdown

export default defineComponent({
    name: 'NotificationBell',
    components: {
        BaseBadge,
        NotificationDropdown,
    },
    props: {
        variant: { // Pass variant down from BaseNavbar if needed for icon color
            type: String,
            default: 'light'
        }
    },
    setup(props) {
        const notificationsStore = useNotificationsStore();
        const showDropdown = ref(false);

        const unreadCount = computed(() => notificationsStore.unreadCount);
        const isLoading = computed(() => notificationsStore.isLoading); // Optional: Show loading state on bell

        const iconColor = computed(() => props.variant === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-gray-500');

        const toggleDropdown = async () => {
            showDropdown.value = !showDropdown.value;
            // Optionally fetch immediately when opening if empty and not loading
            if (showDropdown.value && unreadCount.value === 0 && !isLoading.value) {
                 notificationsStore.fetchNotifications();
            }
        };

        const closeDropdown = () => {
            showDropdown.value = false;
        };

        return {
            unreadCount,
            isLoading,
            showDropdown,
            toggleDropdown,
            closeDropdown,
            iconColor
        };
    },
    template: `
        <div class="relative">
            <button @click="toggleDropdown"
                    type="button"
                    class="relative rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    :class="[iconColor]"
                    aria-haspopup="true"
                    :aria-expanded="showDropdown.toString()"
                    title="View notifications">
                <span class="absolute -inset-1.5" />
                <span class="sr-only">View notifications</span>
                <i class="far fa-bell h-6 w-6 relative top-px" aria-hidden="true"></i>
                <base-badge v-if="unreadCount > 0"
                            color="red"
                            size="xs"
                            shape="pill"
                            class="absolute -top-1 -right-1 px-1.5 py-0.5">
                    {{ unreadCount > 9 ? '9+' : unreadCount }}
                </base-badge>
                 <!-- Optional: Loading indicator on bell -->
                 <svg v-if="isLoading && unreadCount === 0" class="absolute -bottom-1 -right-1 h-3 w-3 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                   <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
            </button>

            <!-- Dropdown Panel -->
            <notification-dropdown
                v-if="showDropdown"
                @close="closeDropdown"
                class="absolute right-0 z-20 mt-2"
             />
        </div>
    `
}); 