// app/components/common/BaseDropdown.js

const { ref, computed, onMounted, onBeforeUnmount } = Vue;

export default {
  name: 'BaseDropdown',
  props: {
    // Button/trigger configuration
    buttonText: {
      type: String,
      default: 'Options'
    },
    buttonIcon: {
      type: String,
      default: 'fa-chevron-down'
    },
    buttonVariant: {
      type: String,
      default: 'default', // 'default', 'minimal', 'custom'
      validator: value => ['default', 'minimal', 'custom'].includes(value)
    },
    // Dropdown position and size
    placement: {
      type: String,
      default: 'right',
      validator: value => ['left', 'right'].includes(value)
    },
    width: {
      type: String,
      default: '56' // Tailwind width class (w-56 = 14rem)
    },
    // Groups for dividers, when using items prop directly
    itemGroups: {
      type: Array,
      default: () => []
      // Format: [{ items: [{text, icon, href, onClick, disabled, type}] }]
    },
    // Whether to show a divider between groups
    dividers: {
      type: Boolean,
      default: true
    },
    // Disabled state
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select'],
  setup(props, { emit, slots }) {
    const isOpen = ref(false);
    const dropdownRef = ref(null);
    const buttonRef = ref(null);
    const menuRef = ref(null);
    const activeItemIndex = ref(-1);
    
    const hasGroups = computed(() => {
      return props.itemGroups.length > 0 || slots.group1 || slots.group2 || slots.group3 || slots.group4;
    });
    
    const totalItems = computed(() => {
      return props.itemGroups.reduce((total, group) => total + (group.items?.length || 0), 0);
    });
    
    const buttonClasses = computed(() => {
      if (props.buttonVariant === 'minimal') {
        return 'flex items-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100 p-1.5';
      } else if (props.buttonVariant === 'custom') {
        // Use custom class via slot
        return '';
      } else {
        // Default button style
        return 'inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50';
      }
    });
    
    const menuClasses = computed(() => {
      return [
        'absolute z-10 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
        `w-${props.width}`,
        props.placement === 'left' ? 'left-0' : 'right-0'
      ];
    });
    
    // Toggle dropdown visibility
    const toggleDropdown = () => {
      if (props.disabled) return;
      
      isOpen.value = !isOpen.value;
      
      if (isOpen.value) {
        activeItemIndex.value = -1;
        // Focus the menu on next tick
        Vue.nextTick(() => {
          menuRef.value?.focus();
        });
      }
    };
    
    // Handle item selection
    const handleItemSelect = (item, index) => {
      if (item.disabled) return;
      
      // If there's an onClick handler on the item, call it
      if (typeof item.onClick === 'function') {
        item.onClick();
      }
      
      // Emit select event with the item and index
      emit('select', item, index);
      
      // Close the dropdown if it's not a type="form" item
      if (item.type !== 'form') {
        isOpen.value = false;
      }
    };
    
    // Keyboard navigation
    const handleKeyDown = (event) => {
      if (!isOpen.value) return;
      
      const itemEls = menuRef.value ? Array.from(menuRef.value.querySelectorAll('[role="menuitem"]:not([disabled])')) : [];
      if (!itemEls.length) return;
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          activeItemIndex.value = activeItemIndex.value < itemEls.length - 1 ? activeItemIndex.value + 1 : 0;
          itemEls[activeItemIndex.value]?.focus();
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          activeItemIndex.value = activeItemIndex.value > 0 ? activeItemIndex.value - 1 : itemEls.length - 1;
          itemEls[activeItemIndex.value]?.focus();
          break;
          
        case 'Escape':
          event.preventDefault();
          isOpen.value = false;
          buttonRef.value?.focus();
          break;
          
        case 'Tab':
          if (!event.shiftKey && activeItemIndex.value === itemEls.length - 1) {
            isOpen.value = false;
          } else if (event.shiftKey && activeItemIndex.value === 0) {
            isOpen.value = false;
          }
          break;
          
        case 'Enter':
        case ' ':
          if (activeItemIndex.value >= 0) {
            event.preventDefault();
            const item = props.itemGroups.flatMap(g => g.items || [])[activeItemIndex.value];
            if (item) handleItemSelect(item, activeItemIndex.value);
          }
          break;
      }
    };
    
    // Handle outside clicks
    const handleClickOutside = (event) => {
      if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
        isOpen.value = false;
      }
    };
    
    // Lifecycle hooks
    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    });
    
    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    });
    
    return {
      isOpen,
      dropdownRef,
      buttonRef,
      menuRef,
      activeItemIndex,
      hasGroups,
      totalItems,
      buttonClasses,
      menuClasses,
      toggleDropdown,
      handleItemSelect
    };
  },
  template: `
    <div ref="dropdownRef" class="relative inline-block text-left">
      <!-- Button Trigger -->
      <div>
        <!-- Use default button if no custom button slot provided -->
        <button 
          v-if="!$slots.button" 
          ref="buttonRef"
          type="button" 
          :class="buttonClasses"
          @click="toggleDropdown"
          :disabled="disabled"
          aria-haspopup="menu"
          :aria-expanded="isOpen"
        >
          <!-- Text only for default variant -->
          <span v-if="buttonVariant !== 'minimal'">{{ buttonText }}</span>
          <span v-if="buttonVariant === 'minimal'" class="sr-only">Open options</span>
          
          <!-- Icon for default variant -->
          <i v-if="buttonVariant !== 'minimal'" :class="['fas', buttonIcon, buttonVariant !== 'minimal' ? '-mr-1 w-5 h-5 text-gray-400' : '']" aria-hidden="true"></i>
          
          <!-- Icon for minimal variant -->
          <i v-if="buttonVariant === 'minimal'" class="fas fa-ellipsis-v" aria-hidden="true"></i>
        </button>
        
        <!-- Use custom button slot if provided -->
        <div v-else @click="toggleDropdown">
          <slot name="button"></slot>
        </div>
      </div>

      <!-- Dropdown Menu with Transition -->
      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div 
          v-if="isOpen" 
          ref="menuRef"
          :class="menuClasses"
          role="menu" 
          aria-orientation="vertical" 
          tabindex="-1"
          @keydown="handleKeyDown"
        >
          <!-- Menu Header (if provided) -->
          <div v-if="$slots.header" class="px-4 py-3">
            <slot name="header"></slot>
          </div>

          <!-- Using direct itemGroups prop -->
          <template v-if="itemGroups.length > 0">
            <div 
              v-for="(group, groupIndex) in itemGroups" 
              :key="'group-' + groupIndex"
              :class="[
                'py-1',
                dividers && groupIndex > 0 ? 'border-t border-gray-100' : '',
                $slots.header && groupIndex === 0 ? 'border-t border-gray-100' : ''
              ]"
            >
              <template v-for="(item, itemIndex) in group.items" :key="'item-' + groupIndex + '-' + itemIndex">
                <!-- Normal menu item -->
                <a
                  v-if="item.type !== 'button' && item.type !== 'form'"
                  :href="item.href || '#'"
                  :class="[
                    activeItemIndex === itemIndex ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'block px-4 py-2 text-sm',
                    item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                    item.icon ? 'group flex items-center' : ''
                  ]"
                  role="menuitem"
                  tabindex="-1"
                  @click.prevent="!item.disabled && handleItemSelect(item, itemIndex)"
                >
                  <i v-if="item.icon" :class="['fas', item.icon, 'mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500']" aria-hidden="true"></i>
                  {{ item.text }}
                </a>
                
                <!-- Button type menu item -->
                <button
                  v-else-if="item.type === 'button'"
                  type="button"
                  :class="[
                    activeItemIndex === itemIndex ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'block w-full text-left px-4 py-2 text-sm',
                    item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                    item.icon ? 'group flex items-center' : ''
                  ]"
                  role="menuitem"
                  tabindex="-1"
                  :disabled="item.disabled"
                  @click="!item.disabled && handleItemSelect(item, itemIndex)"
                >
                  <i v-if="item.icon" :class="['fas', item.icon, 'mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500']" aria-hidden="true"></i>
                  {{ item.text }}
                </button>
                
                <!-- Form wrapped menu item -->
                <form v-else-if="item.type === 'form'" :action="item.formAction || '#'" :method="item.formMethod || 'POST'">
                  <button
                    type="submit"
                    :class="[
                      activeItemIndex === itemIndex ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                      'block w-full text-left px-4 py-2 text-sm',
                      item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                      item.icon ? 'group flex items-center' : ''
                    ]"
                    role="menuitem"
                    tabindex="-1"
                    :disabled="item.disabled"
                    @click="!item.disabled && handleItemSelect(item, itemIndex)"
                  >
                    <i v-if="item.icon" :class="['fas', item.icon, 'mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500']" aria-hidden="true"></i>
                    {{ item.text }}
                  </button>
                </form>
              </template>
            </div>
          </template>

          <!-- Using named group slots -->
          <template v-else>
            <!-- Group 1 -->
            <div v-if="$slots.group1" class="py-1">
              <slot name="group1"></slot>
            </div>
            
            <!-- Group 2 -->
            <div v-if="$slots.group2" class="py-1 border-t border-gray-100">
              <slot name="group2"></slot>
            </div>
            
            <!-- Group 3 -->
            <div v-if="$slots.group3" class="py-1 border-t border-gray-100">
              <slot name="group3"></slot>
            </div>
            
            <!-- Group 4 -->
            <div v-if="$slots.group4" class="py-1 border-t border-gray-100">
              <slot name="group4"></slot>
            </div>
            
            <!-- Default slot for simple use cases -->
            <div v-if="$slots.default && !$slots.group1 && !$slots.group2 && !$slots.group3 && !$slots.group4" class="py-1">
              <slot></slot>
            </div>
          </template>
          
          <!-- Menu Footer (if provided) -->
          <div v-if="$slots.footer" class="px-4 py-3 border-t border-gray-100">
            <slot name="footer"></slot>
          </div>
        </div>
      </transition>
    </div>
  `
};

// Expose globally
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseDropdown = BaseDropdown; 