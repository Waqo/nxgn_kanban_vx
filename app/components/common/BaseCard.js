export default {
  name: 'BaseCard',
  props: {
    noBodyPadding: { type: Boolean, default: false },
    cardBg: { type: String, default: 'bg-white' },
    headerBg: { type: String, default: null },
    bodyBg: { type: String, default: null },
    footerBg: { type: String, default: null },
    noShadow: { type: Boolean, default: false },
    noRounding: { type: Boolean, default: false },
    fullWidthMobile: { type: Boolean, default: false },
  },
  template: `
    <div :class="cardClasses">
      <!-- Header Slot -->
      <div v-if="$slots.header" :class="headerClasses">
        <slot name="header"></slot>
      </div>
      
      <!-- Body Slot (Default) -->
      <div v-if="$slots.body || $slots.default" :class="bodyClasses">
        <slot name="body"></slot>
        <slot></slot> <!-- Allows default slot usage -->
      </div>
      
      <!-- Footer Slot -->
      <div v-if="$slots.footer" :class="footerClasses">
        <slot name="footer"></slot>
      </div>
    </div>
  `,
  setup(props, { slots }) {
    // Determine if dividers are needed
    const hasHeader = Vue.computed(() => !!slots.header);
    const hasBody = Vue.computed(() => !!slots.body || !!slots.default);
    const hasFooter = Vue.computed(() => !!slots.footer);
    const sectionCount = Vue.computed(() => [hasHeader.value, hasBody.value, hasFooter.value].filter(Boolean).length);

    // Determine if backgrounds are mixed (preventing simple divider)
    const bodyEffectiveBg = Vue.computed(() => props.bodyBg ?? props.cardBg);
    const headerEffectiveBg = Vue.computed(() => props.headerBg ?? props.cardBg);
    const footerEffectiveBg = Vue.computed(() => props.footerBg ?? (props.cardBg === 'bg-white' ? 'bg-gray-50' : props.cardBg)); // Default footer bg logic
    const hasMixedBackgrounds = Vue.computed(() => {
      const bgs = new Set();
      if (hasHeader.value) bgs.add(headerEffectiveBg.value);
      if (hasBody.value) bgs.add(bodyEffectiveBg.value);
      if (hasFooter.value) bgs.add(footerEffectiveBg.value);
      return bgs.size > 1;
    });

    const needsDivider = Vue.computed(() => sectionCount.value > 1 && !hasMixedBackgrounds.value);

    // Compute dynamic classes
    const cardClasses = Vue.computed(() => [
      'overflow-hidden',
      props.cardBg, // Base card background
      { 'shadow-sm': !props.noShadow },
      props.noRounding ? '' : (props.fullWidthMobile ? 'sm:rounded-lg' : 'rounded-lg'),
      { 'divide-y divide-gray-200': needsDivider.value }
    ]);

    const headerClasses = Vue.computed(() => [
      'px-4 py-5 sm:px-6',
      props.headerBg ?? '' // Apply specific header bg if provided
    ]);

    const bodyClasses = Vue.computed(() => [
      props.noBodyPadding ? '' : 'px-4 py-5 sm:p-6',
      props.bodyBg ?? '' // Apply specific body bg if provided
    ]);

    const footerClasses = Vue.computed(() => [
      'px-4 py-4 sm:px-6',
      // Apply specific footer bg, defaulting to gray-50 if card is white, else cardBg
      props.footerBg ?? (props.cardBg === 'bg-white' && hasFooter.value ? 'bg-gray-50' : '')
    ]);

    return {
      cardClasses,
      headerClasses,
      bodyClasses,
      footerClasses
    };
  }
}; 