const { defineComponent, computed } = Vue; // Use global Vue
import { useUserStore } from '../../store/userStore.js';

export default defineComponent({
    name: 'UserProfileName',
    props: {
        variant: { // Pass variant down from BaseNavbar for text color
            type: String,
            default: 'light'
        }
    },
    setup(props) {
        const userStore = useUserStore();

        const currentUser = computed(() => userStore.currentUser);
        const userName = computed(() => currentUser.value?.name || 'Loading...');

        // Determine text color based on navbar variant
        const textColor = computed(() => props.variant === 'dark' ? 'text-gray-300' : 'text-gray-700'); // Adjusted dark color slightly

        return {
            userName,
            textColor
        };
    },
    template: `
        <span :class="[textColor, 'text-sm font-medium']">
            {{ userName }}
        </span>
    `
}); 