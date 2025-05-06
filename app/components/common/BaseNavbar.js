import NotificationBell from '../navbar/NotificationBell.js';
import UserProfileMenu from '../navbar/UserProfileMenu.js';
import UserProfileName from '../navbar/UserProfileName.js';
import { useUiStore } from '../../store/uiStore.js';

const { ref, computed } = Vue;

export default {
  name: 'BaseNavbar',
  components: {
    NotificationBell,
    UserProfileMenu,
    UserProfileName
  },
  props: {
    /**
     * Color theme variant.
     * - 'light': White background, dark text.
     * - 'dark': Dark background, light text.
     */
    variant: {
      type: String,
      default: 'light',
      validator: (value) => ['light', 'dark'].includes(value),
    },
    /**
     * Max width constraint for the content (Tailwind class, e.g., '7xl').
     */
    maxWidth: {
      type: String,
      default: '7xl',
    },
    /**
     * Padding for the container (Tailwind class, e.g., 'px-4 sm:px-6 lg:px-8').
     */
    containerPadding: {
      type: String,
      default: 'px-4 sm:px-6 lg:px-8',
    },
    /**
     * Custom classes for the root <nav> element.
     */
    className: {
      type: String,
      default: ''
    },
    /**
     * Enable/disable the mobile menu functionality.
     */
    enableMobileMenu: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, { slots }) {
    const uiStore = useUiStore();
    const isMobileMenuOpen = ref(false);

    const toggleMobileMenu = () => {
      if (props.enableMobileMenu) {
        isMobileMenuOpen.value = !isMobileMenuOpen.value;
      }
    };

    const navClasses = computed(() => {
      return [
        props.variant === 'dark' ? 'bg-gray-800' : 'bg-white shadow-md',
        props.className,
      ].filter(Boolean).join(' ');
    });

    const containerClasses = computed(() => {
      return [
        'mx-auto',
        `max-w-${props.maxWidth}`,
        props.containerPadding,
      ].join(' ');
    });

    const innerFlexClasses = computed(() => {
      return [
        'relative flex justify-between items-center',
        'py-2'
      ].join(' ');
    });

    // Define default text/icon colors based on variant for slots to potentially use
    const defaultTextColor = computed(() => props.variant === 'dark' ? 'text-gray-300' : 'text-gray-500');
    const defaultHoverTextColor = computed(() => props.variant === 'dark' ? 'hover:text-white' : 'hover:text-gray-700');
    const defaultIconColor = computed(() => props.variant === 'dark' ? 'text-gray-400' : 'text-gray-400');
    const defaultHoverBgColor = computed(() => props.variant === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100');
    const currentTextColor = computed(() => props.variant === 'dark' ? 'text-white' : 'text-gray-900');
    const currentBgColor = computed(() => props.variant === 'dark' ? 'bg-gray-900' : 'bg-gray-100'); // Example, adjust as needed
    const currentBorderColor = computed(() => props.variant === 'dark' ? 'border-transparent' : 'border-indigo-500');

    const isGloballyLoading = computed(() => uiStore.isGloballyLoading);

    return {
      isMobileMenuOpen,
      toggleMobileMenu,
      navClasses,
      containerClasses,
      innerFlexClasses,
      // Expose color helpers for slots
      defaultTextColor,
      defaultHoverTextColor,
      defaultIconColor,
      defaultHoverBgColor,
      currentTextColor,
      currentBgColor,
      currentBorderColor,
      isGloballyLoading
    };
  },
  template: `
    <nav :class="navClasses" class="relative">
      <div v-if="isGloballyLoading" class="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 animate-pulse z-50"></div>
      <div :class="containerClasses">
        <div :class="innerFlexClasses">
          <!-- Left Section: Logo and Desktop Nav -->
          <div class="flex items-center">
             <!-- Logo Slot -->
             <div class="flex-shrink-0 flex items-center">
                <slot name="logo">
                  <!-- Default Logo Placeholder -->
                  <img class="h-8 w-auto" src="https://contacts.zoho.com/file?t=appaccount&ID=859244706&nocache=1746352594438" alt="Logo" />
                </slot>
             </div>
             <!-- Desktop Navigation Slot -->
             <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                 <slot name="navigation-desktop" 
                    :defaultTextColor="defaultTextColor" 
                    :defaultHoverTextColor="defaultHoverTextColor"
                    :defaultHoverBgColor="defaultHoverBgColor"
                    :currentTextColor="currentTextColor"
                    :currentBgColor="currentBgColor"
                    :currentBorderColor="currentBorderColor"
                 >
                    <!-- Default Desktop Nav Example -->
                    <!-- 
                    <a href="#" class="inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium" :class="[currentBorderColor, currentTextColor]">Dashboard</a>
                    <a href="#" class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium" :class="[defaultTextColor, defaultHoverTextColor, 'hover:border-gray-300']">Team</a>
                    -->
                 </slot>
             </div>
          </div>

          <!-- Right Section: Actions -->
          <div class="hidden sm:ml-6 sm:flex sm:items-center">
              <slot name="actions-desktop" 
                 :defaultIconColor="defaultIconColor"
                 :defaultHoverTextColor="defaultHoverTextColor"
                 :variant="variant"
              >
                  <!-- Default Actions in desired order -->
                  <notification-bell :variant="variant" />
                  <!-- Only show Name and Avatar when not loading -->
                  <template v-if="!isGloballyLoading">
                    <user-profile-name :variant="variant" class="ml-3" /> 
                    <user-profile-menu :variant="variant" class="ml-3" /> 
                  </template>

                  <!-- Default Desktop Actions Example -->
                  <!-- 
                  <button type="button" class="relative rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" :class="[defaultIconColor, defaultHoverTextColor]">
                      <span class="absolute -inset-1.5" />
                      <span class="sr-only">View notifications</span>
                      <i class="far fa-bell h-6 w-6"></i>
                  </button>
                  -->
              </slot>
          </div>

          <!-- Mobile Menu Button -->
          <div class="-mr-2 flex items-center sm:hidden" v-if="enableMobileMenu">
            <slot name="mobile-menu-button" :toggle="toggleMobileMenu" :isOpen="isMobileMenuOpen" :defaultIconColor="defaultIconColor" :defaultHoverTextColor="defaultHoverTextColor" :defaultHoverBgColor="defaultHoverBgColor">
               <button @click="toggleMobileMenu" type="button" class="relative inline-flex items-center justify-center rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500" :class="[defaultIconColor, defaultHoverBgColor, defaultHoverTextColor]" aria-controls="mobile-menu" :aria-expanded="isMobileMenuOpen.toString()">
                 <span class="absolute -inset-0.5" />
                 <span class="sr-only">Open main menu</span>
                 <i v-if="!isMobileMenuOpen" class="block h-6 w-6 fas fa-bars" aria-hidden="true"></i>
                 <i v-else class="block h-6 w-6 fas fa-times" aria-hidden="true"></i>
               </button>
            </slot>
          </div>

        </div>
      </div>

      <!-- Mobile menu panel -->
      <div v-if="enableMobileMenu && isMobileMenuOpen" class="sm:hidden" id="mobile-menu">
          <slot name="mobile-panel" :closeMenu="toggleMobileMenu">
             <!-- Default Mobile Panel Example -->
             <!-- 
             <div class="space-y-1 pt-2 pb-4">
                <a href="#" class="block border-l-4 py-2 pl-3 pr-4 text-base font-medium" :class="[currentBorderColor, variant === 'dark' ? 'bg-gray-900 text-white' : 'bg-indigo-50 text-indigo-700']">Dashboard</a>
                <a href="#" class="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium" :class="[defaultTextColor, defaultHoverBgColor, 'hover:border-gray-300', defaultHoverTextColor]">Team</a>
             </div>
             -->
          </slot>
      </div>
    </nav>
  `
}; 