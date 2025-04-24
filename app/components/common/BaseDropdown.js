// app/components/common/BaseDropdown.js

export default {
  name: 'BaseDropdown',
  props: {
    buttonText: {
      type: String,
      default: 'Options',
    },
    // We could pass items as a prop later, or use slots
    // items: { type: Array, default: () => [] }
  },
  data() {
    return {
      isOpen: false,
    };
  },
  methods: {
    toggleDropdown() {
      this.isOpen = !this.isOpen;
    },
    closeDropdown() {
      this.isOpen = false;
    },
    // Handle clicks outside the dropdown to close it
    handleClickOutside(event) {
        if (this.$refs.dropdownContainer && !this.$refs.dropdownContainer.contains(event.target)) {
            this.closeDropdown();
        }
    }
  },
  mounted() {
      // Add event listener for clicks outside
      document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
      // Remove event listener on cleanup
      document.removeEventListener('click', this.handleClickOutside);
  },
  // Template defined in widget.html
  template: '#base-dropdown-template'
};

// Expose globally
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseDropdown = BaseDropdown; 