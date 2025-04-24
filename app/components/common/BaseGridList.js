// app/components/common/BaseGridList.js

export default {
  name: 'BaseGridList',
  props: {
    // Columns can be adjusted via Tailwind classes on the root ul element
    // We expect the parent component to loop and render the content for each item via the slot
  },
  // Template defined in widget.html
  template: '#base-grid-list-template'
};

// Expose globally
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseGridList = BaseGridList; 