const { computed } = Vue;

export default {
  name: 'SalesRepInfoCard',
  props: {
    salesRepLookup: {
      type: Object,
      default: null
    },
    email: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    salesOrg: {
        type: Object,
        default: null
    }
  },
  setup(props) {
    const repName = computed(() => props.salesRepLookup?.Name?.zc_display_value || props.salesRepLookup?.zc_display_value?.trim() || "Unassigned");
    const repOrg = computed(() => props.salesOrg?.Org_Name || props.salesOrg?.zc_display_value || "No Organization");
    const repEmail = computed(() => props.email);
    const repPhone = computed(() => props.phone);

    const formattedPhone = computed(() => {
        if (!repPhone.value) return { display: '', link: '' };
        const cleaned = String(repPhone.value).replace(/\D/g, '');
        let display = repPhone.value; 
        if (cleaned.length === 10) {
            display = `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
        } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
            display = `+1 (${cleaned.slice(1,4)}) ${cleaned.slice(4,7)}-${cleaned.slice(7)}`;
        }
        return { display, link: cleaned.length >= 10 ? `+${cleaned.startsWith('1') ? cleaned : '1' + cleaned}` : repPhone.value };
    });

    const makePhoneCall = (e) => {
        e.preventDefault();
        if (formattedPhone.value.link) {
             window.location.href = `tel:${formattedPhone.value.link}`;
        }
    };

    const sendEmail = (e) => {
        e.preventDefault();
        if (repEmail.value) {
            window.location.href = `mailto:${repEmail.value}`;
        }
    };

    return {
        repName,
        repOrg,
        repEmail,
        formattedPhone,
        makePhoneCall,
        sendEmail
    };
  },
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <!-- Header - Mimic BaseCard Header Padding/Border -->
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
             <h3 class="text-lg font-medium leading-6 text-gray-900">Sales Representative</h3>
        </div>
        <!-- Body - Mimic BaseCard Body Padding -->
        <div class="px-4 py-5 sm:p-6">
            <div class="space-y-2">
                <div class="text-sm font-medium text-gray-900">{{ repName }}</div>
                <div class="text-sm text-gray-600 flex items-center">
                    <i class="fas fa-building mr-2 text-gray-400 w-4"></i>
                    <span>{{ repOrg }}</span>
                </div>
                <div class="flex flex-col gap-2 pt-1">
                    <!-- Phone button -->
                    <button
                        v-if="formattedPhone.link"
                        @click="makePhoneCall"
                        class="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 text-left w-fit"
                    >
                        <i class="fas fa-phone w-4 text-gray-400"></i>
                        <span>{{ formattedPhone.display }}</span>
                    </button>
                     <span v-else class="flex items-center gap-2 text-sm text-gray-400 italic">
                         <i class="fas fa-phone w-4 text-gray-400"></i>
                        <span>No Phone</span>
                    </span>
                    <!-- Email button -->
                    <button
                        v-if="repEmail"
                        @click="sendEmail"
                        class="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 text-left truncate w-fit"
                        :title="repEmail"
                    >
                        <i class="fas fa-envelope w-4 text-gray-400"></i>
                        <span class="truncate">{{ repEmail }}</span>
                    </button>
                    <span v-else class="flex items-center gap-2 text-sm text-gray-400 italic">
                        <i class="fas fa-envelope w-4 text-gray-400"></i>
                        <span>No Email</span>
                    </span>
                </div>
            </div>
        </div>
    </div>
  `
}; 