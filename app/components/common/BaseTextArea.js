// app/components/common/BaseTextArea.js

export default {
  name: 'BaseTextArea',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    rows: {
        type: Number,
        default: 3
    },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    // Add props for error states, help text later if needed
  },
  emits: ['update:modelValue'],
  methods: {
    handleInput(event) {
      this.$emit('update:modelValue', event.target.value);
    }
  },
  // Template defined in widget.html
  template: '#base-textarea-template'
};

// Expose globally
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseTextArea = BaseTextArea; 