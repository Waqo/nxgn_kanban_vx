// app/components/modal/tabs/contacts/ContactsTab.js

// Import necessary Base components (e.g., BaseCard, BaseStackedList, BaseAvatar)
import BaseStackedList from '../../../common/BaseStackedList.js';
import BaseAvatar from '../../../common/BaseAvatar.js';
import BaseButton from '../../../common/BaseButton.js';
import BaseBadge from '../../../common/BaseBadge.js';

// Vuex no longer needed
// if (typeof Vuex === 'undefined') { ... }

const ContactsTab = {
    name: 'ContactsTab',
    components: {
        BaseAvatar,
        BaseButton,
        BaseBadge
    },
    // Define the project prop
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    computed: {
        // Remove Vuex mapState for project data
        // ...(typeof Vuex !== 'undefined' ? Vuex.mapState('modal', { ... }) : { ... }),

        // Get the contacts array from the prop
        contacts() {
            console.log('ContactsTab: Contacts from prop:', this.project.Contacts);
            return this.project?.Contacts || [];
        },
    },
    methods: {
        // TODO: Implement Add/Edit Contact functionality later
        addContact() {
            alert('Add Contact functionality not implemented yet.');
        },
        editContact(contactId) {
            alert(`Edit Contact functionality not implemented yet for ID: ${contactId}`);
        },
        formatFullName(contact) {
             // Use API names from Name object
            const firstName = contact.Name?.first_name || '';
            const lastName = contact.Name?.last_name || '';
            return `${firstName} ${lastName}`.trim() || 'Unnamed Contact';
        }
    },
    template: `
        <div class="contacts-tab-content">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">Contacts</h3>
                <base-button @click="addContact" variant="secondary" size="sm">+ Add Contact</base-button>
            </div>

            <div v-if="contacts.length > 0">
                <ul role="list" class="divide-y divide-gray-200">
                    <li v-for="contact in contacts" :key="contact.ID" class="flex justify-between items-center gap-x-6 py-4">
                        <div class="flex min-w-0 gap-x-4">
                            <base-avatar :name="formatFullName(contact)" size="md" variant="blue" class="flex-none"></base-avatar>
                            <div class="min-w-0 flex-auto">
                                <p class="text-sm font-semibold leading-6 text-gray-900">
                                    {{ formatFullName(contact) }}
                                    <base-badge v-if="contact.Primary_Contact_Type1" color="gray" size="sm" class="ml-2 align-middle">{{ contact.Primary_Contact_Type1 }}</base-badge>
                                    <base-badge v-if="contact.Business_POC === 'true'" color="purple" size="sm" class="ml-1 align-middle">Business POC</base-badge>
                                </p>
                                <div class="mt-1 text-xs leading-5 text-gray-500 space-x-3">
                                     <span v-if="contact.Email"><i class="fas fa-envelope mr-1 text-gray-400"></i>{{ contact.Email }}</span>
                                     <span v-if="contact.Phone_Number"><i class="fas fa-phone mr-1 text-gray-400"></i>{{ contact.Phone_Number }}</span>
                                     <span v-if="contact.Mobile_Phone_Number"><i class="fas fa-mobile-alt mr-1 text-gray-400"></i>{{ contact.Mobile_Phone_Number }}</span>
                                </div>
                                <p v-if="contact.Business_Name" class="mt-1 text-xs leading-5 text-gray-500">
                                     <i class="fas fa-building mr-1 text-gray-400"></i>{{ contact.Business_Name }}
                                     <span v-if="contact.Job_Title" class="ml-1">({{ contact.Job_Title }})</span>
                                </p>
                            </div>
                        </div>
                        <div class="shrink-0">
                             <base-button @click="editContact(contact.ID)" variant="ghost" size="xs">
                                Edit<span class="sr-only">, {{ formatFullName(contact) }}</span>
                             </base-button>
                        </div>
                    </li>
                </ul>
            </div>
            <div v-else class="text-center text-gray-500 py-6">
                No contacts found for this project.
            </div>
        </div>
    `
};

export default ContactsTab; 