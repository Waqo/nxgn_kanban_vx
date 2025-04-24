// app/components/common/BaseListContainer.js

export default {
  name: 'BaseListContainer',
  // Typically used with v-for outside, content via slot
  // Props could be added for variations (e.g., bordered, striped)
  // Template defined in widget.html
  template: '#base-list-container-template'
};

// Expose globally
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseListContainer = BaseListContainer; 