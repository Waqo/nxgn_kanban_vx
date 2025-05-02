const { ref, computed } = Vue;

export default {
  name: 'BaseLayout',
  props: {
    // Layout configuration
    showNavbar: { 
      type: Boolean, 
      default: true 
    },
    showSidebar: { 
      type: Boolean, 
      default: true 
    },
    
    // Styling options
    navbarVariant: { 
      type: String, 
      default: 'light',
      validator: value => ['light', 'light-gray', 'dark', 'branded', 'transparent'].includes(value)
    },
    sidebarVariant: {
      type: String,
      default: 'light',
      validator: value => ['light', 'dark', 'narrow', 'branded'].includes(value)
    },
    
    // Content options
    pageTitle: { 
      type: String, 
      default: 'Dashboard' 
    },
    sidebarWidth: { 
      type: String, 
      default: '72' // w-72 in Tailwind (18rem)
    },
    narrowSidebarWidth: {
      type: String,
      default: '20' // w-20 in Tailwind (5rem)
    },
    
    // Header options
    headerPadding: {
      type: String,
      default: '6', // py-6
    },
    
    // Appearance options
    withOverlap: {
      type: Boolean,
      default: false
    },
    compactHeader: {
      type: Boolean,
      default: false
    },
    
    // Container options
    containerMaxWidth: {
      type: String,
      default: '7xl' // max-w-7xl
    },
    
    // Background options
    bgColor: {
      type: String,
      default: 'white' // bg-white
    },
    contentBgColor: {
      type: String,
      default: 'white' // bg-white
    }
  },
  setup(props) {
    const sidebarOpen = ref(false);

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const closeSidebar = () => {
      sidebarOpen.value = false;
    };

    // Computed classes for the navbar
    const navbarClasses = computed(() => {
      const classes = [];
      switch (props.navbarVariant) {
        case 'light-gray': classes.push('bg-white shadow-xs'); break;
        case 'dark': classes.push('bg-gray-800 text-white'); break;
        case 'branded': classes.push('bg-indigo-600 text-white'); break;
        case 'transparent': classes.push('bg-transparent'); break;
        case 'light': default: classes.push('bg-white border-b border-gray-200'); break;
      }
      return classes.join(' ');
    });

    // Computed classes for the sidebar
    const sidebarClasses = computed(() => {
      const classes = [];
      const width = props.sidebarVariant === 'narrow' ? `w-${props.narrowSidebarWidth}` : `w-${props.sidebarWidth}`;
      classes.push(width);
      switch (props.sidebarVariant) {
        case 'dark': classes.push('bg-gray-900 text-white'); break;
        case 'branded': classes.push('bg-indigo-600 text-white'); break;
        case 'narrow': classes.push('bg-white border-r border-gray-200 overflow-y-auto'); break;
        case 'light': default: classes.push('bg-white border-r border-gray-200 overflow-y-auto'); break;
      }
      return classes.join(' ');
    });

    // Computed classes for the main content wrapper
    const mainClasses = computed(() => {
      const classes = ['flex-1'];
      if (props.showSidebar) {
        const sidebarWidthClass = props.sidebarVariant === 'narrow' ? `lg:pl-${props.narrowSidebarWidth}` : `lg:pl-${props.sidebarWidth}`;
        classes.push(sidebarWidthClass);
      }
      if (props.withOverlap) {
        classes.push('-mt-32');
      }
      return classes.join(' ');
    });

    // Computed classes for the content container
    const contentClasses = computed(() => {
      const classes = [`bg-${props.contentBgColor}`];
      if (props.withOverlap) {
        classes.push('rounded-lg shadow-sm');
      }
      return classes.join(' ');
    });

    // Computed value for header padding
    const headerPaddingClasses = computed(() => {
      return props.compactHeader ? 'py-4' : `py-${props.headerPadding}`;
    });

    return {
      sidebarOpen,
      toggleSidebar,
      closeSidebar,
      navbarClasses,
      sidebarClasses,
      mainClasses,
      contentClasses,
      headerPaddingClasses
    };
  },
  template: `
    <div :class="['min-h-full', 'bg-' + bgColor]">
      <!-- Mobile sidebar overlay -->
      <div v-if="showSidebar && sidebarOpen" 
           class="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
           @click="closeSidebar">
      </div>
      
      <!-- Mobile sidebar -->
      <div v-if="showSidebar" 
           :class="['fixed inset-y-0 left-0 z-50 flex transform transition lg:hidden', sidebarOpen ? 'translate-x-0' : '-translate-x-full']">
        <div :class="['relative flex w-full max-w-xs flex-1', sidebarClasses]">
          <!-- Close button -->
          <div class="absolute top-0 right-0 -mr-12 pt-2">
            <button type="button" 
                    class="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    @click="closeSidebar">
              <span class="sr-only">Close sidebar</span>
              <i class="fas fa-times h-6 w-6 text-white"></i>
            </button>
          </div>
          
          <!-- Sidebar content -->
          <div class="h-0 flex-1 overflow-y-auto pt-5 pb-4">
            <slot name="sidebar">
              <!-- Default sidebar content -->
              <div class="flex flex-shrink-0 items-center px-4">
                <img class="h-8 w-auto" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="Logo" />
              </div>
              <nav class="mt-5 flex-1 space-y-1 px-4">
                <div class="text-sm font-medium text-gray-400">Default Sidebar Content</div>
              </nav>
            </slot>
          </div>
        </div>
      </div>
      
      <!-- Static sidebar for desktop -->
      <div v-if="showSidebar" class="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col" :class="sidebarClasses">
        <slot name="sidebar">
          <!-- Default sidebar content -->
          <div class="flex h-16 flex-shrink-0 items-center px-6">
            <img class="h-8 w-auto" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="Logo" />
          </div>
          <div class="flex flex-1 flex-col overflow-y-auto">
            <nav class="flex-1 space-y-1 px-4 py-4">
              <div class="text-sm font-medium text-gray-400">Default Sidebar Content</div>
            </nav>
          </div>
        </slot>
      </div>
      
      <!-- Main content -->
      <div :class="mainClasses">
        <!-- Navbar -->
        <header v-if="showNavbar" :class="['sticky top-0 z-10', navbarClasses]">
          <div :class="['mx-auto max-w-' + containerMaxWidth, 'px-4 sm:px-6 lg:px-8', headerPaddingClasses]">
            <div class="flex items-center justify-between">
              <!-- Mobile menu button -->
              <button v-if="showSidebar"
                      type="button"
                      class="inline-flex items-center justify-center rounded-md p-2 text-gray-500 lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                      @click="toggleSidebar">
                <span class="sr-only">Open sidebar</span>
                 <i class="fas fa-bars h-6 w-6"></i>
              </button>
              
              <!-- Logo or title (shown on mobile or when no sidebar) -->
              <div v-if="!showSidebar || navbarVariant !== 'light'" class="flex-shrink-0 flex items-center">
                <slot name="navbarLogo">
                  <h1 class="text-xl font-semibold">{{ pageTitle }}</h1>
                </slot>
              </div>
              
              <!-- Page title -->
              <div v-if="!compactHeader" class="hidden sm:block">
                <slot name="navbarTitle">
                  <h1 class="text-3xl font-bold tracking-tight" :class="navbarVariant.includes('dark') || navbarVariant === 'branded' ? 'text-white' : 'text-gray-900'">{{ pageTitle }}</h1>
                </slot>
              </div>
              <div v-else class="block">
                <slot name="navbarTitle">
                  <h1 class="text-lg font-semibold" :class="navbarVariant.includes('dark') || navbarVariant === 'branded' ? 'text-white' : 'text-gray-900'">{{ pageTitle }}</h1>
                </slot>
              </div>
              
              <!-- Navbar actions -->
              <div class="flex items-center space-x-4">
                <slot name="navbarActions"></slot>
              </div>
            </div>
            
            <!-- Additional navbar content -->
            <slot name="navbarContent"></slot>
          </div>
        </header>
        
        <!-- Page header for overlap variant -->
        <div v-if="withOverlap" :class="[navbarVariant.includes('dark') || navbarVariant === 'branded' ? navbarClasses : 'bg-gray-800', 'pb-32']">
          <slot name="overlapHeader">
            <header class="py-10">
              <div :class="['mx-auto max-w-' + containerMaxWidth, 'px-4 sm:px-6 lg:px-8']">
                <h1 class="text-3xl font-bold tracking-tight text-white">{{ pageTitle }}</h1>
              </div>
            </header>
          </slot>
        </div>
        
        <!-- Main page content -->
        <main>
          <div :class="['mx-auto max-w-' + containerMaxWidth, 'px-4 sm:px-6 lg:px-8', withOverlap ? 'pb-12' : 'py-6']">
            <div :class="[contentClasses, withOverlap ? 'px-5 py-6 sm:px-6' : '']">
              <slot></slot>
            </div>
          </div>
        </main>
      </div>
    </div>
  `
}; 