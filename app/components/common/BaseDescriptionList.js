// app/components/common/BaseDescriptionList.js

export default {
  name: 'BaseDescriptionList',
  props: {
      // Could add props for bordered, title etc.
  },
  // Template defined in widget.html
  template: '#base-description-list-template'
};

// Expose globally
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseDescriptionList = BaseDescriptionList; 