const { defineComponent, computed, ref } = Vue; // Use global Vue
import { useUserStore } from '../../store/userStore.js';
// BaseAvatar and BaseDropdown are globally registered, no need to import/register here
import { getInitials } from '../../utils/helpers.js'; // Import helper

export default defineComponent({
    name: 'UserProfileMenu',
    //    components: { // No need to register global components
    //        BaseAvatar,
    //        BaseDropdown
    //    },
    props: {
        variant: { // Pass variant down if needed for styling
            type: String,
            default: 'light'
        }
    },
    setup(props) {
        const userStore = useUserStore();
        const showDropdown = ref(false);

        const currentUser = computed(() => userStore.currentUser);
        const userName = computed(() => currentUser.value?.name || 'Loading...');
        const userInitials = computed(() => getInitials(userName.value));
        const userProfileLink = "https://creatorapp.zoho.com/nexgenroofingandsolar/nexgen-portal#Page:Edit_Profile";

        const buttonTextColor = computed(() => props.variant === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700');

        const toggleDropdown = () => {
            showDropdown.value = !showDropdown.value;
        };

        const closeDropdown = () => {
            showDropdown.value = false;
        };

        return {
            userName,
            userInitials,
            showDropdown,
            toggleDropdown,
            closeDropdown,
            buttonTextColor,
            userProfileLink
        };
    },
    template: `
        <div class="relative ml-3">
             <base-dropdown :show="showDropdown" @close="closeDropdown" origin="right">
                <template #button>
                     <!-- Simplified Trigger: Just the Avatar Button -->
                     <button @click="toggleDropdown" type="button" class="relative flex items-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
                        <span class="absolute -inset-1.5"></span>
                        <span class="sr-only">Open user menu</span>
                        <!-- Increased avatar size slightly for easier clicking -->
                        <base-avatar :initials="userInitials" size="sm" :bgColorClass="'bg-indigo-600'" />
                    </button>
                </template>
                <template #default>
                    <div class="py-1" role="none">
                        <a :href="userProfileLink"
                           target="_blank"
                           class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                           role="menuitem"
                           tabindex="-1"
                           id="user-menu-item-0">
                           Your Profile
                        </a>
                        <!-- Add Logout or other items later -->
                        <!--
                        <a href="#" @click.prevent="logout" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem" tabindex="-1" id="user-menu-item-2">
                           Sign out
                        </a>
                         -->
                    </div>
                </template>
             </base-dropdown>
        </div>
    `
}); 