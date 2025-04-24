// app/components/common/BaseTabs.js

export default {
  name: 'BaseTabs',
  props: {
    tabs: {
      type: Array,
      required: true,
      // Expected shape: [{ id: String, name: String, disabled?: Boolean }, ...]
    },
    modelValue: { // Use modelValue for v-model binding on the active tab ID
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  methods: {
    selectTab(tabId) {
      const selectedTab = this.tabs.find(t => t.id === tabId);
      if (selectedTab && !selectedTab.disabled) {
        this.$emit('update:modelValue', tabId);
      }
    }
  },
  // Template defined in widget.html
  template: '#base-tabs-template'
};

// Expose BaseTabs globally
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseTabs = BaseTabs; 