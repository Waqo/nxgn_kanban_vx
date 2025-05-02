// app/components/modal/tabs/contacts/ContactCard.js

// Import Base Components used
// import BaseAvatar from '../../../common/BaseAvatar.js'; // Not used
// import BaseButton from '../../../common/BaseButton.js'; // Removed - Globally Registered
// import BaseBadge from '../../../common/BaseBadge.js'; // Removed - Globally Registered

const ContactCard = {
    name: 'ContactCard',
    components: {
        // Base components are globally registered
        // BaseButton,
        // BaseBadge
    },
    props: {
        contact: {
            type: Object,
            required: true
        },
        mainOwnerContactId: {
            type: String,
            default: null
        },
        // State to manage inline confirmation for this specific card
        isConfirmingAction: {
            type: Object, // { action: 'delete'/'setOwner' } or null
            default: null
        }
    },
    emits: ['edit', 'delete-request', 'set-owner-request', 'confirm-action', 'cancel-confirmation'],
    methods: {
        formatFullName(contact) {
            // Replicated from ContactsTab for self-containment
            const firstName = contact.Name?.first_name || contact.First_Name || '';
            const lastName = contact.Name?.last_name || contact.Last_Name || '';
            return `${firstName} ${lastName}`.trim() || 'Unnamed Contact';
        },
        // Emit events for parent (ContactsTab) to handle state/execution
        requestEdit() {
            this.$emit('edit', this.contact.ID);
        },
        requestSetOwnerConfirmation() {
            this.$emit('set-owner-request', this.contact.ID);
        },
        requestDeleteConfirmation() {
            this.$emit('delete-request', this.contact.ID);
        },
        confirmAction() {
            // Check if isConfirmingAction and its action property exist before emitting
            if (this.isConfirmingAction && this.isConfirmingAction.action) {
                this.$emit('confirm-action', this.isConfirmingAction.action, this.contact.ID);
            } else {
                console.error('Confirm action triggered without valid confirmation state:', this.isConfirmingAction);
            }
        },
        cancelConfirmation() {
            this.$emit('cancel-confirmation', this.contact.ID);
        }
    },
    template: `
        <div class="col-span-1 relative bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-shadow duration-150 h-full flex flex-col">
            <!-- Action Buttons / Confirmation -->
            <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
                <!-- Normal Buttons -->
                <template v-if="!isConfirmingAction">
                    <base-button @click="requestEdit" variant="icon-ghost" size="xs" title="Edit Contact" class="p-1 text-gray-400 hover:text-gray-600">
                        <i class="far fa-edit"></i>
                    </base-button>
                    <base-button 
                        v-if="contact.ID !== mainOwnerContactId"
                        @click="requestSetOwnerConfirmation" 
                        variant="icon-ghost" 
                        size="xs" 
                        title="Set as Main Project Owner" 
                        class="p-1 text-gray-400 hover:text-gray-600"
                    >
                        <i class="fas fa-user-check"></i>
                    </base-button>
                    <base-button 
                        v-if="contact.ID !== mainOwnerContactId"
                        @click="requestDeleteConfirmation" 
                        variant="icon-ghost" 
                        size="xs" 
                        class="p-1 text-red-500 hover:text-red-700" 
                        title="Delete Contact"
                     >
                        <i class="far fa-trash-alt"></i>
                    </base-button>
                </template>
                <!-- Confirmation Buttons -->
                <template v-else>
                    <span class="text-xs font-medium mr-1" :class="isConfirmingAction.action === 'delete' ? 'text-red-700' : 'text-yellow-700'">Sure?</span>
                    <base-button 
                        @click="confirmAction" 
                        variant="icon-ghost" 
                        size="xs" 
                        :class="isConfirmingAction.action === 'delete' ? 'p-1 text-red-500 hover:text-red-700' : 'p-1 text-yellow-600 hover:text-yellow-800'" 
                        title="Confirm Action"
                      >
                        <i class="fas fa-check"></i>
                    </base-button>
                    <base-button @click="cancelConfirmation" variant="icon-ghost" size="xs" class="p-1 text-gray-400 hover:text-gray-600" title="Cancel">
                        <i class="fas fa-times"></i>
                    </base-button>
                </template>
            </div>

            <!-- Header Section -->
            <div class="flex items-center gap-3 mb-4">
                <div class="flex-1">
                    <p class="text-lg font-medium text-gray-900 break-words">{{ formatFullName(contact) }}</p>
                    <div class="mt-1 space-x-1">
                        <base-badge v-if="contact.Primary_Contact_Type1" color="blue" size="sm">{{ contact.Primary_Contact_Type1 }}</base-badge>
                        <base-badge v-if="contact.Business_POC === 'true'" color="purple" size="sm">Business POC</base-badge>
                    </div>
                </div>
            </div>

            <!-- Details Section -->
            <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-3 flex-grow">
                <!-- Column 1: Standard Details -->
                <div class="space-y-2">
                    <p v-if="contact.Job_Title" class="flex items-center gap-2 text-gray-600">
                        <i class="fas fa-briefcase w-4 h-4 text-gray-400"></i>
                        <span>{{ contact.Job_Title }}</span>
                    </p>
                    <p v-if="contact.Business_Name" class="flex items-center gap-2 text-gray-600">
                        <i class="far fa-building w-4 h-4 text-gray-400"></i>
                        <span>{{ contact.Business_Name }}</span>
                    </p>
                    <p v-if="contact.Email" class="flex items-center gap-2 text-gray-600">
                        <i class="far fa-envelope w-4 h-4 text-gray-400"></i>
                        <a :href="'mailto:' + contact.Email" class="text-blue-600 hover:text-blue-700 hover:underline break-all">{{ contact.Email }}</a>
                    </p>
                    <p v-if="contact.Phone_Number" class="flex items-center gap-2 text-gray-600">
                        <i class="fas fa-phone-alt w-4 h-4 text-gray-400"></i>
                        <a :href="'tel:' + contact.Phone_Number" class="text-blue-600 hover:text-blue-700 hover:underline">{{ contact.Phone_Number }}</a>
                    </p>
                    <p v-if="contact.Mobile_Phone_Number" class="flex items-center gap-2 text-gray-600">
                        <i class="far fa-mobile-alt w-4 h-4 text-gray-400"></i>
                        <a :href="'tel:' + contact.Mobile_Phone_Number" class="text-blue-600 hover:text-blue-700 hover:underline">{{ contact.Mobile_Phone_Number }}</a>
                    </p>
                </div>
                
                <!-- Column 2: Billing Address -->
                <div class="space-y-2">
                     <p v-if="contact.Billing_Address?.address_line_1" class="flex items-start gap-2 text-gray-600">
                          <i class="fas fa-map-marker-alt w-4 h-4 text-gray-400 mt-0.5"></i>
                          <span class="break-words text-left">
                               {{ contact.Billing_Address?.address_line_1 || '' }}
                               <template v-if="contact.Billing_Address?.address_line_2"><br/>{{ contact.Billing_Address.address_line_2 }}</template>
                               <template v-if="contact.Billing_Address?.address_line_1 || contact.Billing_Address?.address_line_2"><br/></template>
                               {{ contact.Billing_Address?.district_city ? contact.Billing_Address.district_city + ',' : '' }} 
                               {{ contact.Billing_Address?.state_province ? contact.Billing_Address.state_province : '' }} 
                               {{ contact.Billing_Address?.postal_code ? contact.Billing_Address.postal_code : '' }}
                          </span>
                     </p>
                </div>
            </div>
        </div>
    `
};

export default ContactCard; 